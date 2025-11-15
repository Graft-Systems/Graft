from django.db import models
from .store import Store
from .wine import Wine

class InventorySnapshot(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    wine = models.ForeignKey(Wine, on_delete=models.CASCADE)
    snapshot_date = models.DateField()
    bottles_on_hand = models.IntegerField()

    def __str__(self):
        return f"{self.store} {self.wine} @ {self.snapshot_date}"
