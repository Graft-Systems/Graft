from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import IntegrityError
from .models import UserProfile, Producer


class RegisterSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, write_only=True)

    class Meta:
        model = User
        fields = ("username", "password", "role")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        role = validated_data.pop("role")
        username = validated_data['username']
        password = validated_data['password']
        try:
            user = User.objects.create_user(username=username, password=password)
            UserProfile.objects.create(user=user, role=role)
        except IntegrityError:
            user = User.objects.get(username=username)
            # Check if completed
            if role == 'producer' and Producer.objects.filter(name=username).exists():
                raise serializers.ValidationError("Username already exists and profile is completed.")
            # Else, allow update
            user.set_password(password)
            user.save()
            if hasattr(user, 'profile'):
                user.profile.role = role
                user.profile.save()
            else:
                UserProfile.objects.create(user=user, role=role)
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
        fields = '__all__'
