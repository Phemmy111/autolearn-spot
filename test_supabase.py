from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv(".env.local")
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

response = supabase.table('site_settings').select('*').execute()
print(response.data)
