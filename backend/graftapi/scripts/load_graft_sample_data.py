import os
from django.core.management import call_command
from django.conf import settings

def run():
    fixture_path = os.path.join(settings.BASE_DIR, "graftapi", "fixtures", "graft_sample_data.json")

    print(f"Loading fixture: {fixture_path}")

    call_command("loaddata", fixture_path)

    print("Sample Graft data loaded successfully.")
