import requests

def fetch_starrail_data(uid, ltoken, ltuid):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) miHoYoBBS/2.0.0',
        'Cookie': f'ltoken={ltoken}; ltuid={ltuid}'
    }
    
    try:
        # 获取角色基础信息
        role_url = f'https://api-takumi-record.mihoyo.com/game_record/app/hkrpg/api/role?uid={uid}'
        role_res = requests.get(role_url, headers=headers)
        role_res.raise_for_status()
        role_data = role_res.json()
        
        # 获取详细角色数据
        detail_url = f'https://api-takumi-record.mihoyo.com/game_record/app/hkrpg/api/avatar/info?uid={uid}'
        detail_res = requests.get(detail_url, headers=headers)
        detail_res.raise_for_status()
        detail_data = detail_res.json()
        
        return {
            'role_info': role_data['data'],
            'characters': detail_data['data']['avatar_list']
        }
        
    except Exception as e:
        print(f"请求失败: {str(e)}")
        return None

# 使用示例
uid = "106105403"  # 你的UID
ltoken = "YOUR_LTOKEN"  # 从浏览器Cookie获取
ltuid = "YOUR_LTUID"   # 你的米游社账号ID

data = fetch_starrail_data(uid, ltoken, ltuid)
if data:
    print(f"玩家名称: {data['role_info']['nickname']}")
    for char in data['characters']:
        print(f"角色: {char['name']} (等级 {char['level']})")