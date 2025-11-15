from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
import os

class Command(BaseCommand):
    help = "Load Graft sample data into the database."

    def handle(self, *args, **kwargs):
        fixture_path = os.path.join(settings.BASE_DIR, "graftapi", "fixtures", "graft_sample_data.json")

        if not os.path.exists(fixture_path):
            self.stderr.write(self.style.ERROR(f"Fixture file not found: {fixture_path}"))
            return

        self.stdout.write(f"Loading sample data from {fixture_path}...")
        
        call_command("loaddata", fixture_path)

        self.stdout.write(self.style.SUCCESS("Graft sample data loaded successfully!"))
