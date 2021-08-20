
let Neuroevolution = function (options) {
	let self = this;


	self.options = {

		activation: function (a) {
			ap = (-a) / 1;
			return (1 / (1 + Math.exp(ap)))
		},


		randomClamped: function () {
			return Math.random() * 2 - 1;
		},


		network: [1, [1], 1],
		population: 50,
		elitism: 0.2,
		randomBehaviour: 0.2,
		mutationRate: 0.1,
		mutationRange: 0.5,
		historic: 0,
		lowHistoric: false,
		scoreSort: -1,
		nbChild: 1

	}

	self.set = function (options) {
		for (let i in options) {
			if (this.options[i] != undefined) {

				self.options[i] = options[i];
			}
		}
	}

	self.set(options);

	let Neuron = function () {
		this.value = 0;
		this.weights = [];
	}

	Neuron.prototype.populate = function (nb) {
		this.weights = [];
		for (let i = 0; i < nb; i++) {
			this.weights.push(self.options.randomClamped());
		}
	}


	let Layer = function (index) {
		this.id = index || 0;
		this.neurons = [];
	}

	Layer.prototype.populate = function (nbNeurons, nbInputs) {
		this.neurons = [];
		for (let i = 0; i < nbNeurons; i++) {
			let n = new Neuron();
			n.populate(nbInputs);
			this.neurons.push(n);
		}
	}

	let Network = function () {
		this.layers = [];
	}

	Network.prototype.perceptronGeneration = function (input, hiddens, output) {
		let index = 0;
		let previousNeurons = 0;
		var layer = new Layer(index);
		layer.populate(input, previousNeurons); // Number of Inputs will be set to
		// 0 since it is an input layer.
		previousNeurons = input; // number of input is size of previous layer.
		this.layers.push(layer);
		index++;
		for (let i in hiddens) {
			// Repeat same process as first layer for each hidden layer.
			let layer = new Layer(index);
			layer.populate(hiddens[i], previousNeurons);
			previousNeurons = hiddens[i];
			this.layers.push(layer);
			index++;
		}
		var layer = new Layer(index);
		layer.populate(output, previousNeurons); // Number of input is equal to

		this.layers.push(layer);
	}


	Network.prototype.getSave = function () {
		let datas = {
			neurons: [],
			weights: []
		};

		for (let i in this.layers) {
			datas.neurons.push(this.layers[i].neurons.length);
			for (let j in this.layers[i].neurons) {
				for (let k in this.layers[i].neurons[j].weights) {

					datas.weights.push(this.layers[i].neurons[j].weights[k]);
				}
			}
		}
		return datas;
	}

	Network.prototype.setSave = function (save) {
		let previousNeurons = 0;
		let index = 0;
		let indexWeights = 0;
		this.layers = [];
		for (let i in save.neurons) {

			let layer = new Layer(index);
			layer.populate(save.neurons[i], previousNeurons);
			for (let j in layer.neurons) {
				for (let k in layer.neurons[j].weights) {

					layer.neurons[j].weights[k] = save.weights[indexWeights];

					indexWeights++;
				}
			}
			previousNeurons = save.neurons[i];
			index++;
			this.layers.push(layer);
		}
	}


	Network.prototype.compute = function (inputs) {
		for (let i in inputs) {
			if (this.layers[0] && this.layers[0].neurons[i]) {
				this.layers[0].neurons[i].value = inputs[i];
			}
		}

		let prevLayer = this.layers[0];
		for (let i = 1; i < this.layers.length; i++) {
			for (let j in this.layers[i].neurons) {

				let sum = 0;
				for (let k in prevLayer.neurons) {

					sum += prevLayer.neurons[k].value *
						this.layers[i].neurons[j].weights[k];
				}

				this.layers[i].neurons[j].value = self.options.activation(sum);
			}
			prevLayer = this.layers[i];
		}

		let out = [];
		let lastLayer = this.layers[this.layers.length - 1];
		for (let i in lastLayer.neurons) {
			out.push(lastLayer.neurons[i].value);
		}
		return out;
	}


	let Genome = function (score, network) {
		this.score = score || 0;
		this.network = network || null;
	}


	let Generation = function () {
		this.genomes = [];
	}

	Generation.prototype.addGenome = function (genome) {

		for (let i = 0; i < this.genomes.length; i++) {

			if (self.options.scoreSort < 0) {
				if (genome.score > this.genomes[i].score) {
					break;
				}
			} else {
				if (genome.score < this.genomes[i].score) {
					break;
				}
			}

		}


		this.genomes.splice(i, 0, genome);
	}


	Generation.prototype.breed = function (g1, g2, nbChilds) {
		let datas = [];
		for (let nb = 0; nb < nbChilds; nb++) {
			// Deep clone of genome 1.
			let data = JSON.parse(JSON.stringify(g1));
			for (let i in g2.network.weights) {
				// Genetic crossover
				// 0.5 is the crossover factor.
				// FIXME Really should be a predefined constant.
				if (Math.random() <= 0.5) {
					data.network.weights[i] = g2.network.weights[i];
				}
			}

			for (let i in data.network.weights) {
				if (Math.random() <= self.options.mutationRate) {
					data.network.weights[i] += Math.random() *
						self.options.mutationRange *
						2 -
						self.options.mutationRange;
				}
			}
			datas.push(data);
		}

		return datas;
	}

	Generation.prototype.generateNextGeneration = function () {
		let nexts = [];

		for (let i = 0; i < Math.round(self.options.elitism *
				self.options.population); i++) {
			if (nexts.length < self.options.population) {

				nexts.push(JSON.parse(JSON.stringify(this.genomes[i].network)));
			}
		}

		for (let i = 0; i < Math.round(self.options.randomBehaviour *
				self.options.population); i++) {
			let n = JSON.parse(JSON.stringify(this.genomes[0].network));
			for (let k in n.weights) {
				n.weights[k] = self.options.randomClamped();
			}
			if (nexts.length < self.options.population) {
				nexts.push(n);
			}
		}

		let max = 0;
		while (true) {
			for (let i = 0; i < max; i++) {
				let childs = this.breed(this.genomes[i], this.genomes[max],
					(self.options.nbChild > 0 ? self.options.nbChild : 1));
				for (let c in childs) {
					nexts.push(childs[c].network);
					if (nexts.length >= self.options.population) {
						return nexts;
					}
				}
			}
			max++;
			if (max >= this.genomes.length - 1) {
				max = 0;
			}
		}
	}


	let Generations = function () {
		this.generations = [];
		let currentGeneration = new Generation();
	}

	Generations.prototype.firstGeneration = function (input, hiddens, output) {

		let out = [];
		for (let i = 0; i < self.options.population; i++) {

			let nn = new Network();
			nn.perceptronGeneration(self.options.network[0],
				self.options.network[1],
				self.options.network[2]);
			out.push(nn.getSave());
		}

		this.generations.push(new Generation());
		return out;
	}


	Generations.prototype.nextGeneration = function () {
		if (this.generations.length === 0) {

			return false;
		}

		let gen = this.generations[this.generations.length - 1]
			.generateNextGeneration();
		this.generations.push(new Generation());
		return gen;
	}


	Generations.prototype.addGenome = function (genome) {

		if (this.generations.length === 0) return false;


		return this.generations[this.generations.length - 1].addGenome(genome);
	}

	self.generations = new Generations();

	self.restart = function () {
		self.generations = new Generations();
	}

	self.nextGeneration = function () {
		let networks = [];

		if (self.generations.generations.length === 0) {

			networks = self.generations.firstGeneration();
		} else {

			networks = self.generations.nextGeneration();
		}

		let nns = [];
		for (let i in networks) {
			let nn = new Network();
			nn.setSave(networks[i]);
			nns.push(nn);
		}

		if (self.options.lowHistoric) {
			if (self.generations.generations.length >= 2) {
				let genomes =
					self.generations
					.generations[self.generations.generations.length - 2]
					.genomes;
				for (let i in genomes) {
					delete genomes[i].network;
				}
			}
		}

		if (self.options.historic !== -1) {

			if (self.generations.generations.length > self.options.historic + 1) {
				self.generations.generations.splice(0,
					self.generations.generations.length - (self.options.historic + 1));
			}
		}

		return nns;
	}

	self.networkScore = function (network, score) {
		self.generations.addGenome(new Genome(score, network.getSave()));
	}
}
