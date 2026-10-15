"""Publica el repositorio privado, sprints e Issues mediante GitHub CLI ya autenticado."""
import json
import subprocess
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
REPO='lortizbaeza-gif/nutrigest'
def gh(*args):
    result=subprocess.run(['gh',*args],cwd=ROOT,check=True,capture_output=True,text=True,encoding='utf-8')
    return result.stdout.strip()
def api(method,endpoint,data):
    result=subprocess.run(['gh','api','--method',method,endpoint,'--input','-'],input=json.dumps(data),cwd=ROOT,check=True,capture_output=True,text=True,encoding='utf-8')
    return json.loads(result.stdout)
def main():
    login=gh('api','user','--jq','.login')
    if login!='lortizbaeza-gif':raise RuntimeError('Inicia sesión en GitHub CLI con lortizbaeza-gif.')
    existing=gh('repo','list',login,'--limit','1000','--json','nameWithOwner')
    if REPO not in [r['nameWithOwner'] for r in json.loads(existing)]:
        gh('repo','create',REPO,'--private','--description','NutriGest: seguimiento nutricional y coordinación de agentes en tres sprints','--add-readme')
    milestones=json.loads(gh('api',f'repos/{REPO}/milestones?state=all&per_page=100'))
    mapping={m['title']:m['number'] for m in milestones}
    for n,date in [(1,'2026-10-06'),(2,'2026-10-07'),(3,'2026-10-08')]:
        title=f'Sprint {n}'
        if title not in mapping:
            result=api('POST',f'repos/{REPO}/milestones',{'title':title,'due_on':datetime.fromisoformat(date+'T23:59:59').replace(tzinfo=ZoneInfo('America/Mexico_City')).astimezone(timezone.utc).isoformat().replace('+00:00','Z'),'description':'Iteración diaria del proyecto académico.'})
            mapping[title]=result['number']
    tasks=json.loads((ROOT/'orchestrator/backlog.json').read_text(encoding='utf-8'))['tasks']
    team=json.loads((ROOT/'orchestrator/team.json').read_text(encoding='utf-8'))
    issues=json.loads(gh('issue','list','--repo',REPO,'--state','all','--limit','1000','--json','title,number,url'))
    for task in tasks:
        title=f"[{task['id']}] {task['title']}"
        if any(i['title'].startswith('['+task['id']+']') for i in issues):continue
        body=(ROOT/f"docs/github-issues/{task['id']}.md").read_text(encoding='utf-8')
        data={'title':title,'body':body,'milestone':mapping[f"Sprint {task['sprint']}"]}
        username=team[task['agent']]['github']
        if username:data['assignees']=[username]
        result=api('POST',f'repos/{REPO}/issues',data)
        print(result['html_url'])
    print('Repositorio y planificación disponibles: https://github.com/'+REPO)
if __name__=='__main__':main()
