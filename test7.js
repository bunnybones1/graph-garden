function generateNumbers() {
	var data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

	function magicNumber(val) {
		return 1 / (val * 2) + 42 / val;
	}

	function specialNumber(val) {
		return Math.sqrt(val + 1.1);
	}

	function useThings(val) {
	  return Math.pow(magicNumber(val), specialNumber(val));
	}

	var data2 = things.map(useThings);
	return data2;
}

generateNumbers();