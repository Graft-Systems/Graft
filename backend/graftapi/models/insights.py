from django.db import models
from .store import Store
from .wine import Wine

class StorePlacementStatus(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("low", "Low Stock"),
        ("inactive", "Inactive"),
    ]

    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    wine = models.ForeignKey(Wine, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    estimated_bottles = models.IntegerField(default=0)
    last_sale_date = models.DateField(null=True, blank=True)
    last_delivery_date = models.DateField(null=True, blank=True)
    estimated_days_left = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ("store", "wine")
        verbose_name = "Store Placement Status"
        verbose_name_plural = "Store Placement Statuses"

    def __str__(self):
        return f"{self.store} - {self.wine}: {self.status}"
