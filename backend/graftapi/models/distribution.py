from django.db import models
from .store import Store
from .wine import Wine

class Delivery(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    wine = models.ForeignKey(Wine, on_delete=models.CASCADE)
    delivery_date = models.DateField()
    cases = models.IntegerField()
    bottles_per_case = models.IntegerField(default=12)

    def total_bottles(self):
        return self.cases * self.bottles_per_case


class RetailSale(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    wine = models.ForeignKey(Wine, on_delete=models.CASCADE)
    date = models.DateField()
    bottles_sold = models.IntegerField()

    def __str__(self):
        return f"{self.store.name} sold {self.bottles_sold} bottles"
