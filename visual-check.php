<?php
class Deez extends That {
	static function deez() {
	}
}
$d = new Deez(1 + 2);
echo $d->prop."\n";


enum Suit {}


switch (3) {
	default:
	case 3: break;
}

function f(?string $a = "Hello"): void {}

$h?->name ?? "John";
$a ? $b : $c;
