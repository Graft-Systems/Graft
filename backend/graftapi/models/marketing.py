from django.db import models
from .wine import Producer


class MarketingMaterial(models.Model):
    CATEGORY_CHOICES = [
        ("email", "Email Campaign"),
        ("instagram", "Instagram Post"),
        ("shelf_talker", "Shelf Talker"),
        ("one_sheet", "One Sheet"),
        ("tasting_card", "Tasting Card"),
    ]

    producer = models.ForeignKey(Producer, on_delete=models.CASCADE, related_name="marketing_materials")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    prompt_used = models.TextField()
    generated_content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_category_display()} - {self.created_at:%Y-%m-%d}"
