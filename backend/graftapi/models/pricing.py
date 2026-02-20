from django.db import models
from .store import Store
from .wine import Wine


class WholesalePrice(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="wholesale_prices")
    wine = models.ForeignKey(Wine, on_delete=models.CASCADE, related_name="wholesale_prices")
    price = models.DecimalField(max_digits=8, decimal_places=2)
    date_effective = models.DateField()

    class Meta:
        ordering = ["-date_effective"]

    def __str__(self):
        return f"{self.wine.name} @ {self.store.name}: ${self.price}"
