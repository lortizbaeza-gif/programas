"""Orquestador local: dependencias, asignación, prompts y ejecución aislada de Codex CLI."""
import argparse
import json
import shutil
import subprocess
import sys
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATUSES = ['pendiente', 'en_curso', 'bloqueada', 'en_revision', 'terminada']

def read_board(path):
    board = json.loads(path.read_text(encoding='utf-8'))
    validate(board)
    return board

def validate(board):
    tasks = board['tasks']; ids = [t['id'] for t in tasks]
    if len(ids) != len(set(ids)):
        raise ValueError('IDs repetidos.')
    by_id = {t['id']:t for t in tasks}
    for task in tasks:
        if task['status'] not in STATUSES:
            raise ValueError('Estado inválido.')
        if task['agent'] not in ['orquestador','datos','backend','frontend','calidad']:
            raise ValueError('Agente desconocido.')
        if any(d not in by_id for d in task['dependencies']):
            raise ValueError('Dependencia inexistente.')
        for scope in task['paths']:
            if Path(scope).is_absolute() or '..' in Path(scope).parts:
                raise ValueError('Ámbito de archivos inválido.')
    def visit(id, chain):
        if id in chain:
            raise ValueError('Dependencias cíclicas.')
        for dep in by_id[id]['dependencies']:
            visit(dep, chain|{id})
    for id in ids:
        visit(id,set())

def missing(board, task):
    done = {t['id'] for t in board['tasks'] if t['status']=='terminada'}
    return [d for d in task['dependencies'] if d not in done]

def conflicts(a,b):
    return any(x.startswith(y) or y.startswith(x) for x in a['paths'] for y in b['paths'])

def ready(board, sprint=None, agent=None):
    active = [t for t in board['tasks'] if t['status']=='en_curso']
    return [t for t in board['tasks'] if t['status']=='pendiente' and not missing(board,t)
        and (sprint is None or t['sprint']==sprint) and (not agent or t['agent']==agent)
        and not any(conflicts(t,a) or t['agent']==a['agent'] for a in active)]

def transition(board, task, status, evidence=None):
    allowed = {'pendiente':['en_curso','bloqueada'], 'en_curso':['en_revision','bloqueada'],
               'bloqueada':['pendiente'], 'en_revision':['terminada','en_curso','bloqueada'], 'terminada':[]}
    if status not in allowed[task['status']]:
        raise ValueError(f"Transición no permitida: {task['status']} → {status}.")
    if status=='en_curso':
        if missing(board,task):
            raise ValueError('Hay dependencias sin terminar: '+', '.join(missing(board,task)))
        for active in board['tasks']:
            if active['id']!=task['id'] and active['status']=='en_curso' and (conflicts(task,active) or task['agent']==active['agent']):
                raise ValueError('Hay un agente activo o archivos compartidos: '+active['id'])
    if status in ['en_revision','terminada','bloqueada'] and not evidence:
        raise ValueError('Es necesario registrar evidencia o motivo.')
    if status=='terminada' and missing(board,task):
        raise ValueError('No se puede terminar sin sus dependencias.')
    task['status']=status
    task['evidence']=evidence or task.get('evidence')
    task['updated_at']=datetime.now(timezone.utc).isoformat()

def prompt(task):
    return f"""Trabaja en NutriGest como agente {task['agent']} para {task['owner']}.
Lee AGENTS.md, agents/{task['agent']}.md y docs/SPRINTS.md.
Tarea {task['id']}, sprint {task['sprint']}: {task['title']}.
Criterio de aceptación: {task['acceptance']}.
Ámbito de archivos: {', '.join(task['paths'])}.
Dependencias: {', '.join(task['dependencies']) or 'ninguna'}.
Usa datos ficticios. No cambies backlog ni ejecutes agentes adicionales. No publiques ni fusiones cambios automáticamente.
La implementación inicial ya existe: revisa lo disponible, identifica qué falta y evita duplicarlo. Implementa ajustes necesarios y ejecuta pruebas pertinentes. Entrega resumen, archivos, comandos reales, resultados y bloqueos.
Deja el trabajo para revisión; un resultado del agente no acredita aprobación ni integración.
"""

def save(path, board):
    temporary=path.with_suffix('.tmp')
    temporary.write_text(json.dumps(board,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    temporary.replace(path)

@contextmanager
def board_lock(path):
    lock=path.with_suffix('.lock')
    try:
        lock.mkdir()
    except FileExistsError:
        raise ValueError('Otro comando está modificando el backlog. Espera su finalización.')
    try:
        yield
    finally:
        lock.rmdir()

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backlog',type=Path,default=ROOT/'orchestrator/backlog.json')
    sub=parser.add_subparsers(dest='command',required=True)
    sub.add_parser('board')
    nextp=sub.add_parser('next');nextp.add_argument('--sprint',type=int,choices=[1,2,3]);nextp.add_argument('--agent')
    for command in ['prompt','run']:
        p=sub.add_parser(command);p.add_argument('task')
    p=sub.add_parser('status');p.add_argument('task');p.add_argument('status',choices=STATUSES);p.add_argument('--evidence')
    args=parser.parse_args(argv)
    lock_context = board_lock(args.backlog) if args.command in ['status','run'] else None
    acquired = False
    try:
        if lock_context:
            lock_context.__enter__(); acquired = True
        board=read_board(args.backlog)
        if args.command in ['board','next']:
            tasks=board['tasks'] if args.command=='board' else ready(board,args.sprint,args.agent)
            for task in tasks:
                deps=missing(board,task)
                print(f"{task['id']} | S{task['sprint']} | {task['owner']} | {task['status']} | {task['title']}"+(f" | espera {','.join(deps)}" if deps else ''))
            if not tasks:print('No hay tareas disponibles para estos filtros.')
            return 0
        task=next((t for t in board['tasks'] if t['id']==args.task),None)
        if task is None:raise ValueError('Tarea desconocida.')
        if args.command=='prompt':
            print(prompt(task));return 0
        if args.command=='status':
            transition(board,task,args.status,args.evidence);save(args.backlog,board);return 0
        codex=shutil.which('codex');git=shutil.which('git')
        if not codex or not git:raise ValueError('Instala Codex CLI y Git e inicia sesión en Codex antes de ejecutar.')
        if task['status']!='pendiente':raise ValueError('Solo se ejecutan tareas pendientes.')
        if subprocess.run([git,'rev-parse','--verify','HEAD'],cwd=ROOT,capture_output=True).returncode:
            raise ValueError('Inicializa Git y crea un commit antes de ejecutar agentes.')
        if subprocess.run([git,'status','--porcelain'],cwd=ROOT,capture_output=True,text=True).stdout.strip():
            raise ValueError('Guarda o confirma los cambios del repositorio antes de ejecutar.')
        transition(board,task,'en_curso')
        worktree=ROOT/'worktrees'/task['id']
        worktree.parent.mkdir(exist_ok=True)
        subprocess.run([git,'worktree','add','-b',f"codex/{task['id'].lower()}",str(worktree),'HEAD'],cwd=ROOT,check=True)
        save(args.backlog,board)
        output=ROOT/'.orchestrator-runs'/task['id'];output.mkdir(parents=True,exist_ok=True)
        try:
            with (output/'events.jsonl').open('w',encoding='utf-8') as log:
                completed=subprocess.run([codex,'exec','--sandbox','workspace-write','--json','-C',str(worktree),'-o',str(output/'result.md'),'-'],input=prompt(task),text=True,stdout=log,stderr=subprocess.STDOUT)
            transition(board,task,'en_revision' if completed.returncode==0 else 'bloqueada',f"Salida Codex {completed.returncode}; {output.relative_to(ROOT)}; worktree {worktree.relative_to(ROOT)}")
        except Exception as exc:
            transition(board,task,'bloqueada',str(exc));save(args.backlog,board);raise
        save(args.backlog,board)
        print('Trabajo disponible para revisión en',worktree)
        return completed.returncode
    except (ValueError,subprocess.CalledProcessError,OSError) as exc:
        print('Error:',exc,file=sys.stderr);return 1
    finally:
        if acquired:
            lock_context.__exit__(None,None,None)

if __name__=='__main__':
    raise SystemExit(main())
