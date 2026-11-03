<?php
declare(strict_types=1);
session_start(['cookie_httponly'=>true,'cookie_samesite'=>'Strict','cookie_secure'=>(!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')]);
function esc($s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
$dir = getenv('DRINKS_DATA_DIR') ?: dirname(__DIR__).'/drinks-private';
if (!is_dir($dir)) mkdir($dir,0700,true);
$db = new PDO('sqlite:'.$dir.'/drinks.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$db->exec('PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS ingredients(id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, category TEXT NOT NULL); CREATE TABLE IF NOT EXISTS recipes(id INTEGER PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL,instructions TEXT NOT NULL,glass TEXT NOT NULL); CREATE TABLE IF NOT EXISTS recipe_ingredients(recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,ingredient_id INTEGER REFERENCES ingredients(id),amount TEXT NOT NULL,PRIMARY KEY(recipe_id,ingredient_id)); CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
if (!$db->query("SELECT value FROM settings WHERE key='seeded'")->fetchColumn()) {
 $db->beginTransaction();
 $items=[['Gin','Alcolici'],['Vodka','Alcolici'],['Rum bianco','Alcolici'],['Tequila','Alcolici'],['Bourbon','Alcolici'],['Campari','Liquori'],['Vermouth rosso','Liquori'],['Triple sec','Liquori'],['Acqua tonica','Mixer'],['Soda','Mixer'],['Cola','Mixer'],['Succo di lime','Extra'],['Succo di limone','Extra'],['Zucchero','Extra'],['Menta','Extra']];
 $q=$db->prepare('INSERT INTO ingredients(name,category) VALUES(?,?)'); foreach($items as $i)$q->execute($i);
 $recipes=[['Gin Tonic','Il grande classico, fresco e frizzante.','Riempi il bicchiere di ghiaccio. Versa il gin e aggiungi la tonica lentamente. Mescola delicatamente.','Highball',[[1,'50 ml'],[9,'150 ml']]],['Negroni','Tre ingredienti. Un equilibrio perfetto.','Versa gli ingredienti in un tumbler con ghiaccio. Mescola per raffreddare. A piacere, profuma con una scorza di arancia.','Tumbler',[[1,'30 ml'],[6,'30 ml'],[7,'30 ml']]],['Mojito','Un piccolo viaggio a Cuba.','Sciogli lo zucchero nel lime. Premi delicatamente la menta, aggiungi rum e ghiaccio. Completa con soda e mescola.','Highball',[[3,'50 ml'],[12,'25 ml'],[14,'2 cucchiaini'],[15,'8 foglie'],[10,'60 ml']]],['Margarita','Agrumato, vivace, senza compromessi.','Agita tequila, triple sec e lime in uno shaker con ghiaccio. Filtra in una coppetta. Il bordo di sale è facoltativo.','Coppetta',[[4,'50 ml'],[8,'25 ml'],[12,'25 ml']]],['Daiquiri','Semplice fuori. Straordinario dentro.','Sciogli lo zucchero nel lime, aggiungi il rum e agita con ghiaccio. Filtra in una coppetta fredda.','Coppetta',[[3,'60 ml'],[12,'25 ml'],[14,'2 cucchiaini']]],['Cuba Libre','Rum, bollicine e voglia di vacanza.','Versa rum e lime in un bicchiere con ghiaccio. Completa con cola e mescola delicatamente.','Highball',[[3,'50 ml'],[11,'120 ml'],[12,'10 ml']]],['Americano','L’aperitivo che non passa mai di moda.','Versa Campari e vermouth in un tumbler con ghiaccio. Aggiungi soda e mescola delicatamente.','Tumbler',[[6,'30 ml'],[7,'30 ml'],[10,'30 ml']]],['Whiskey Sour','Morbido, agrumato, con carattere.','Sciogli lo zucchero nel limone. Aggiungi bourbon e agita energicamente con ghiaccio. Filtra in un tumbler.','Tumbler',[[5,'60 ml'],[13,'30 ml'],[14,'2 cucchiaini']]]];
 foreach($recipes as $r){$db->prepare('INSERT INTO recipes(name,description,instructions,glass) VALUES(?,?,?,?)')->execute(array_slice($r,0,4));$id=$db->lastInsertId();foreach($r[4] as $i)$db->prepare('INSERT INTO recipe_ingredients VALUES(?,?,?)')->execute([$id,...$i]);}
 $db->exec("INSERT INTO settings VALUES('seeded','1')");$db->commit();
}
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
$hash=$db->query("SELECT value FROM settings WHERE key='password'")->fetchColumn();
$error='';
if($_SERVER['REQUEST_METHOD']==='POST') {
 try {
 if(!hash_equals($_SESSION['csrf'],$_POST['csrf']??''))throw new Exception('Sessione scaduta. Ricarica la pagina.');
 $action=$_POST['action']??'';
 if($action==='login') {if(!$hash || !password_verify($_POST['password']??'',$hash))throw new Exception('Password non corretta.');session_regenerate_id(true);$_SESSION['admin']=true;}
 elseif($action==='setup') {if($hash)throw new Exception('Amministratore già configurato.');if(strlen($_POST['password']??'')<12)throw new Exception('Usa almeno 12 caratteri.');$db->prepare("INSERT INTO settings VALUES('password',?)")->execute([password_hash($_POST['password'],PASSWORD_DEFAULT)]);session_regenerate_id(true);$_SESSION['admin']=true;}
 elseif($action==='logout'){unset($_SESSION['admin']);}
 else {
 if(empty($_SESSION['admin']))throw new Exception('Accesso richiesto.');
 if($action==='ingredient') { $name=trim($_POST['name']??'');$cat=$_POST['category']??'';if(!$name || mb_strlen($name)>80 || !in_array($cat,['Alcolici','Liquori','Mixer','Extra'],true))throw new Exception('Controlla nome e categoria.');$db->prepare('INSERT INTO ingredients(name,category) VALUES(?,?)')->execute([$name,$cat]); }
 elseif($action==='recipe') {
 $name=trim($_POST['name']??'');$steps=trim($_POST['instructions']??'');$amounts=array_filter($_POST['amount']??[],fn($a)=>trim($a)!=='');
 if(!$name || !$steps || !$amounts)throw new Exception('Inserisci nome, preparazione e almeno un ingrediente con quantità.');
 $db->beginTransaction();$db->prepare('INSERT INTO recipes(name,description,instructions,glass) VALUES(?,?,?,?)')->execute([$name,trim($_POST['description']??''),$steps,trim($_POST['glass']??'Tumbler')]);$id=$db->lastInsertId();foreach($amounts as $iid=>$amount)$db->prepare('INSERT INTO recipe_ingredients VALUES(?,?,?)')->execute([$id,(int)$iid,trim($amount)]);$db->commit();
 } elseif($action==='delete'){$db->prepare('DELETE FROM recipes WHERE id=?')->execute([(int)($_POST['id']??0)]);}
 }
 header('Location: ?admin=1');exit;
 } catch(Throwable $e){if($db->inTransaction())$db->rollBack();$error=$e instanceof PDOException?'Operazione non riuscita: controlla che il nome non sia già presente.':$e->getMessage();}
}
$ingredients=$db->query('SELECT * FROM ingredients ORDER BY category,name')->fetchAll(PDO::FETCH_ASSOC);
$recipes=$db->query('SELECT * FROM recipes ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
foreach($recipes as &$r){$q=$db->prepare('SELECT i.*,ri.amount FROM recipe_ingredients ri JOIN ingredients i ON i.id=ri.ingredient_id WHERE recipe_id=?');$q->execute([$r['id']]);$r['ingredients']=$q->fetchAll(PDO::FETCH_ASSOC);}unset($r);
function token(){echo '<input type="hidden" name="csrf" value="'.esc($_SESSION['csrf']).'">';}
