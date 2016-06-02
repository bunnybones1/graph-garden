var Signal = require('signals').Signal;

function TreeBuilder(app) {
	this.app = app;
	this.buildTree = this.buildTree.bind(this);
	this.onNodeSignal = new Signal();
	this.onCompleteSignal = new Signal();
}

TreeBuilder.prototype.buildTree = function(estree){
	var onNodeSignal = this.onNodeSignal;

	var types = [];
	function registerType(typeString) {
		if(types.indexOf(typeString) === -1) types.push(typeString);
	}

	var branchesToProcess = [[estree]];
	var processedBranches = [];
	var nodeCount = 1;
	var skippedBranches = 0;

	onNodeSignal.dispatch(estree);

	function traverseTree(branch, parentNode) {
		if(!branch) return;
		if(processedBranches.indexOf(branch) !== -1) {
			skippedBranches++;
			return;
		}
		processedBranches.push(branch);
		var i;
		if(branch instanceof Array) {
			for (i = branch.length - 1; i >= 0; i--) {
				branchesToProcess.push([branch[i], parentNode]);
			}
		} else if(branch instanceof Object) {
			if(branch.type) {
				registerType(branch.type);
				nodeCount++;
				onNodeSignal.dispatch(branch, parentNode);
				parentNode = branch;
			}
			Object.keys(branch).forEach(function(key) {
				branchesToProcess.push([branch[key], parentNode]);
			});
		}
	}

	// try {
		var iters = 150;
		while(branchesToProcess.length > 0 && iters > 0) {
			var temp = branchesToProcess.slice();
			branchesToProcess.length = 0;
			iters--;
			for (var j = temp.length - 1; j >= 0; j--) {
				traverseTree.apply(null, temp[j]);
			}
		}
		if(iters === 0) {
			console.warn('Tree not full. Increase iters.');
		}
	// } catch(e) {
	// 	console.error(e);
	// } finally {
	// }
	console.log(branchesToProcess.length);
	console.log('tree node types:', types.length, types);
	console.log('branches:', processedBranches.length);
	console.log('nodes:', nodeCount);
	console.log('stillToProcess:', branchesToProcess.length);
	console.log('skippedBranches:', skippedBranches);
	this.onCompleteSignal.dispatch();
 	// console.log(JSON.stringify(estree, null, '\t'));
};

module.exports = TreeBuilder;