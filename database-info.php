<?php if ($databaseInfo !== null): ?>
<details class="panel database-info" open>
 <summary><strong>Database in uso</strong></summary>
 <p>File SQLite letto dall’app: <code><?=esc($databaseInfo['path'])?></code></p>
 <p><strong><?=$databaseInfo['ingredients']?></strong> ingredienti · <strong><?=$databaseInfo['recipes']?></strong> ricette · <strong><?=$databaseInfo['links']?></strong> associazioni ingrediente–ricetta.</p>
 <p>Per gli inserimenti manuali, apri questo esatto file e salva le modifiche nel programma che utilizzi (Write Changes / COMMIT). Poi ricarica questa pagina e verifica i conteggi.</p>
 <?php if ($databaseInfo['without_ingredients']): ?>
 <p>Ricette senza ingredienti associati: <?=esc(implode(', ', array_column($databaseInfo['without_ingredients'], 'name')))?>. Completa le relative righe in <code>recipe_ingredients</code> usando gli ID di <code>recipes</code> e <code>ingredients</code>.</p>
 <?php endif ?>
 <?php if ($databaseInfo['invalid_links']): ?>
 <p role="alert">Sono presenti <?=$databaseInfo['invalid_links']?> associazioni con ID di ingredienti o ricette inesistenti. Correggi gli ID in <code>recipe_ingredients</code>.</p>
 <?php endif ?>
 <details><summary>Ingredienti letti dal database</summary><ul>
 <?php foreach ($ingredients as $ingredient): ?>
 <li>#<?=(int)$ingredient['id']?> · <?=esc($ingredient['name'])?> (<?=esc($ingredient['category'])?>)</li>
 <?php endforeach ?>
 </ul></details>
</details>
<?php endif ?>
