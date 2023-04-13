<?php
class Human extends Entity {
	static function sayHello() {
	}
}
$h = new Human(1 + 2);
echo $h->name."\n";
$h->sayHello();


enum Suit {}


switch (3) {
	default:
	case 3: break;
}

function f(?string $a = "Hello"): void {}

$h?->name ?? "John";
$a ? $b : $c;
$a[42]

goto label;
label:

/**
 * My summary
 * @param p1 first parameter
 * @return something
 * @see other function
 */
