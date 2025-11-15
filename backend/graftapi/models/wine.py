from django.db import models

class Producer(models.Model):
    name = models.CharField(max_length=255)
    region = models.CharField(max_length=255, blank=True)
    contact_email = models.EmailField(blank=True)

    def __str__(self):
        return self.name


class Wine(models.Model):
    producer = models.ForeignKey(Producer, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    varietal = models.CharField(max_length=255, blank=True)
    region = models.CharField(max_length=255, blank=True)
    vintage = models.IntegerField(null=True, blank=True)
    bottle_size_ml = models.IntegerField(default=750)

    def __str__(self):
        return f"{self.name} ({self.vintage or 'NV'})"
