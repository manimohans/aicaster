import requests
from datetime import datetime, timedelta
import time

# Define Farcaster Epoch (January 1, 2021 00:00:00 UTC)
FARCASTER_EPOCH = datetime(2021, 1, 1, 0, 0, 0).timestamp()

def convert_farcaster_time(timestamp):
    # Convert Farcaster timestamp (seconds since epoch) to actual timestamp
    actual_timestamp = FARCASTER_EPOCH + timestamp
    return datetime.fromtimestamp(actual_timestamp)

def get_casts(base_url="https://nemes.farcaster.xyz:2281", url_param=None, max_age_hours=48):
    all_casts = []
    next_page = ""
    current_time = datetime.now()
    cutoff_time = current_time - timedelta(hours=max_age_hours)

    while True:
        api_url = f"{base_url}/v1/castsByParent?url={url_param}&reverse=1"
        if next_page:
            api_url += f"&pageToken={next_page}"

        try:
            response = requests.get(api_url)
            response.raise_for_status()
            data = response.json()

            for cast in data['messages']:
                cast_time = convert_farcaster_time(cast['data']['timestamp'])
                
                # Skip if cast is older than cutoff time
                if cast_time < cutoff_time:
                    return all_casts

                cast_info = {
                    'fid': cast['data']['fid'],
                    'timestamp': cast_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'text': cast['data']['castAddBody']['text'],
                    'hash': cast['hash'],
                    'embeds': cast['data']['castAddBody'].get('embeds', [])
                }
                all_casts.append(cast_info)

            next_page = data.get('nextPageToken')
            if not next_page:
                break

        except requests.exceptions.RequestException as e:
            print(f"Error fetching casts: {e}")
            break

    return all_casts

def display_feed(casts):
    if not casts:
        print("No casts found in the last 48 hours.")
        return

    print("\n=== Farcaster Social Feed ===\n")
    for cast in casts:
        print(f"User FID: {cast['fid']}")
        print(f"Time: {cast['timestamp']}")
        print(f"Message: {cast['text']}")
        print(f"Cast Hash: {cast['hash']}")
        if cast['embeds']:
            print("Embeds:")
            for embed in cast['embeds']:
                print(f"  - {embed}")
        print("-" * 50)

if __name__ == "__main__":
    url_param = "chain://eip155:7777777/erc721:0x5747eef366fd36684e8893bf4fe628efc2ac2d10"
    casts = get_casts(url_param=url_param)
    display_feed(casts) 