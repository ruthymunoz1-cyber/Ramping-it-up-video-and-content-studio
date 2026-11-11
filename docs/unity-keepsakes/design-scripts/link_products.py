# Link Shopify products (already imported into Printful) to Printful catalog variants + files, by SKU, using a specs JSON.
import json,subprocess,time,sys
SPECS=sys.argv[1]; EXT=json.loads(sys.argv[2]); FORCE=len(sys.argv)>3 and sys.argv[3]=='force'   # {"KEY": "shopify product numeric id"}
STORE=19015734
def api(m,p,b=None):
    while True:
        c=['curl','-sS','--max-time','90','-X',m,'https://api.printful.com'+p,'-H','Content-Type: application/json']
        if b: c+=['-d',json.dumps(b)]
        r=json.loads(subprocess.run(c,capture_output=True,text=True).stdout)
        if r.get('code')==429: time.sleep(35); continue
        return r
P={p['key']:p for p in json.load(open(SPECS))}
def find(ext):
    off=0
    while True:
        r=api('GET',f'/sync/products?store_id={STORE}&limit=100&offset={off}')
        for p in r['result']:
            if p['external_id']==ext: return p['id']
        off+=100
        if off>=r['paging']['total']: return None
for key,ext in EXT.items():
    pid=None
    for _ in range(20):
        pid=find(ext)
        if pid: break
        time.sleep(15)
    if not pid: print(key,'NOT IMPORTED'); continue
    d=api('GET',f'/sync/products/{pid}?store_id={STORE}')['result']
    for v in d['sync_variants']:
        if v['synced'] and not FORCE: continue
        l=P[key]['link'].get(v['sku'])
        if not l: print(key,'no link for',v['sku']); continue
        r=api('PUT',f"/sync/variant/{v['id']}?store_id={STORE}",{"variant_id":l['variant_id'],"is_ignored":False,"files":l['files']})
        if r.get('code')!=200: print(key,v['sku'],r.get('result'))
        time.sleep(4)
    time.sleep(5)
    d=api('GET',f'/sync/products/{pid}?store_id={STORE}')['result']
    bad=[v['sku'] for v in d['sync_variants'] if not v['synced']]
    print(key,'printful',pid,'synced',d['sync_product']['synced'],'/',d['sync_product']['variants'],'unsynced:',bad)
