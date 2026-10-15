import copy
import tempfile
from pathlib import Path
import unittest
from orchestrator.runner import validate, ready, transition, prompt, board_lock

class OrchestratorTests(unittest.TestCase):
    def setUp(self):
        self.board={'tasks':[
            {'id':'T01','agent':'datos','owner':'Diana','sprint':1,'title':'Modelo','acceptance':'Migraciones vÃ¡lidas','paths':['backend/models/'],'dependencies':[],'status':'pendiente'},
            {'id':'T02','agent':'backend','owner':'Genny','sprint':1,'title':'API','acceptance':'API vÃ¡lida','paths':['backend/api/'],'dependencies':['T01'],'status':'pendiente'},
            {'id':'T03','agent':'frontend','owner':'Jilder','sprint':2,'title':'UI','acceptance':'UI vÃ¡lida','paths':['frontend/'],'dependencies':[],'status':'pendiente'}]}
    def test_ready_gates_dependencies_and_sprint(self):
        self.assertEqual([t['id'] for t in ready(self.board,1)],['T01'])
        self.assertEqual([t['id'] for t in ready(self.board,2)],['T03'])
    def test_blocked_dependency_cannot_start(self):
        with self.assertRaises(ValueError):transition(self.board,self.board['tasks'][1],'en_curso')
    def test_success_requires_review_and_evidence(self):
        task=self.board['tasks'][0]
        with self.assertRaises(ValueError):transition(self.board,task,'terminada','Prueba')
        transition(self.board,task,'en_curso')
        with self.assertRaises(ValueError):transition(self.board,task,'en_revision')
        transition(self.board,task,'en_revision','Pruebas y commit')
        transition(self.board,task,'terminada','RevisiÃ³n e integraciÃ³n verificadas')
        self.assertEqual([t['id'] for t in ready(self.board,1)],['T02'])
    def test_shared_paths_prevent_concurrent_assignment(self):
        self.board['tasks'][2]['paths']=['backend/']
        transition(self.board,self.board['tasks'][0],'en_curso')
        with self.assertRaises(ValueError):transition(self.board,self.board['tasks'][2],'en_curso')
    def test_same_agent_not_assigned_twice(self):
        self.board['tasks'][2]['agent']='datos'
        transition(self.board,self.board['tasks'][0],'en_curso')
        self.assertEqual(ready(self.board),[])
    def test_invalid_cycle_and_missing_dependency(self):
        self.board['tasks'][0]['dependencies']=['T02']
        with self.assertRaises(ValueError):validate(self.board)
        self.board['tasks'][0]['dependencies']=['missing']
        with self.assertRaises(ValueError):validate(self.board)
    def test_blocked_reason_and_requeue(self):
        task=self.board['tasks'][0]
        with self.assertRaises(ValueError):transition(self.board,task,'bloqueada')
        transition(self.board,task,'bloqueada','Falta contrato API')
        transition(self.board,task,'pendiente')
        self.assertEqual(task['status'],'pendiente')
    def test_lock_does_not_release_another_owner(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'backlog.json'
            with board_lock(path):
                with self.assertRaises(ValueError):
                    with board_lock(path):pass
                self.assertTrue(path.with_suffix('.lock').exists())
            self.assertFalse(path.with_suffix('.lock').exists())
    def test_scope_traversal_rejected_and_prompt_contains_acceptance(self):
        self.assertIn('Migraciones vÃ¡lidas',prompt(self.board['tasks'][0]))
        self.board['tasks'][0]['paths']=['../outside']
        with self.assertRaises(ValueError):validate(self.board)

if __name__=='__main__':unittest.main()
