var data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function useThings(val) {
  return Math.pow(1 / (val * 2) + 42 / val, Math.sqrt(val + 1.1));
}

var data2 = things.map(useThings);