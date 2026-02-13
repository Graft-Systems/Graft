from django.db import transaction
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import IntegrityError
from .models import UserProfile, Producer
from .models.wine import Wine
from .models.store import Store, StoreChain


class RegisterSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, write_only=True)

    class Meta:
        model = User
        fields = ("username", "password", "role")
        # Allow re-registering an existing username so we can finish profile setup
        # (DRF's default UniqueValidator would block this before `create` runs).
        extra_kwargs = {
            "password": {"write_only": True},
            "username": {"validators": []},
        }

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Username is required.")
        return value

    def create(self, validated_data):
        role = validated_data.pop("role")
        username = validated_data['username']
        password = validated_data['password']
        with transaction.atomic():
            user = User.objects.filter(username=username).first()

            # Existing user: treat as re-registration / password reset
            if user:
                if role == 'producer' and Producer.objects.filter(user=user).exists():
                    raise serializers.ValidationError("This username already has a completed producer profile.")
                user.set_password(password)
                user.save()
                if hasattr(user, 'profile'):
                    user.profile.role = role
                    user.profile.save()
                else:
                    UserProfile.objects.create(user=user, role=role)
            else:
                user = User.objects.create_user(username=username, password=password)
                UserProfile.objects.create(user=user, role=role)

            # Ensure minimal producer profile exists so downstream endpoints work.
            if role == 'producer' and not hasattr(user, 'producer_profile'):
                Producer.objects.create(user=user, name=username)

        return user

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["role"] = instance.profile.role if hasattr(instance, "profile") else None
        return data


class ProducerSerializer(serializers.ModelSerializer):
    """
    Serializer for Producer profile creation.
    """
    class Meta:
        model = Producer
        fields = ('name', 'region', 'contact_email')
        read_only_fields = ('user',)


class StoreSerializer(serializers.ModelSerializer):
    """
    Serializer for Store profile creation.
    """
    class Meta:
        model = Store
        fields = [
            'id',
            'name',
            'neighborhood',
            'street_address',
            'city',
            'state',
            'zip_code',
            'contact_email',
        ]
        read_only_fields = ('id', 'user',)


class WineSerializer(serializers.ModelSerializer):
    # We mark producer as read_only because we will assign it 
    # automatically from the logged-in user in the view.
    producer_name = serializers.ReadOnlyField(source='producer.name')

    class Meta:
        model = Wine
        fields = [
            'id', 
            'producer', 
            'producer_name', 
            'name', 
            'varietal', 
            'region', 
            'vintage', 
            'bottle_size_ml'
        ]
        read_only_fields = ['id', 'producer']

    def validate_vintage(self, value):
        """Check that the vintage is a realistic year."""
        import datetime
        current_year = datetime.date.today().year
        if value and (value < 1700 or value > current_year + 5):
            raise serializers.ValidationError("Please enter a valid vintage year.")
        return value
