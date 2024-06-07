// !---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---
// Leaving this in here as an example of how to call predict but it got moved during me making this PR
// so whoever works on this next just move the calls to the right place and it should work as intended.
// !---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---!---

// import { Coordinator } from './Coordinator.js';
// import { DataCubeIndexera } from './DataCubeIndexer.js';
// import { MosaicClient } from './MosaicClient.js';
// import { Selection } from './Selection.js';

// export class FilterGroup {
//   /**
//    * @param {Coordinator} coordinator The Mosaic coordinator.
//    * @param {Selection} selection The shared filter selection.
//    * @param {object|boolean} index Boolean flag or options hash for
//    *  a data cube indexer. Falsy values disable indexing.
//    */
//   constructor(coordinator, selection, index = true) {
//     this.mc = coordinator;
//     this.selection = selection;
//     /** @type {Set<MosaicClient>} */
//     this.clients = new Set();
//     /** @type {DataCubeIndexer | null} */
//     this.indexer = null;
//     this.index(index);

//     const { value, activate, predict } = this.handlers = {
//       value: () => this.update(),
//       predict: () => this.updatePrediction(),
//       activate: clause => { this.indexer?.index(this.clients, clause); },
//     };
//     selection.addEventListener('value', value);
//     selection.addEventListener('activate', activate);
//     selection.addEventListener('predict', predict);
//   }

//   finalize() {
//     const { value, activate, predict } = this.handlers;
//     this.selection.removeEventListener('value', value);
//     this.selection.removeEventListener('predict', predict);
//     this.selection.removeEventListener('activate', activate);
//   }

//   index(state) {
//     const { selection } = this;
//     const { resolver } = selection;
//     this.indexer = state && (resolver.single || !resolver.union)
//       ? new DataCubeIndexer(this.mc, { ...state, selection })
//       : null;
//   }

//   reset() {
//     this.indexer?.reset();
//   }

//   add(client) {
//     (this.clients = new Set(this.clients)).add(client);
//     return this;
//   }

//   remove(client) {
//     if (this.clients.has(client)) {
//       (this.clients = new Set(this.clients)).delete(client);
//     }
//     return this;
//   }

//   /**
//    * Internal method to process a selection update.
//    * The return value is passed as a selection callback value.
//    * @returns {Promise} A Promise that resolves when the update completes.
//    */
//   update() {
//     const { mc, indexer, clients, selection } = this;
//     const hasIndex = indexer?.index(clients);
//     return hasIndex
//       ? indexer.update()
//       : defaultUpdate(mc, clients, selection);
//   }

//   /**
//    * Internal method to process a selection prediction (happens at the end of a brush).
//    * The return value is passed as a selection callback value.
//    * @returns {Promise} A Promise that resolves when the prediction completes.
//    */
//   updatePrediction() {
//     const { indexer, clients } = this;
//     return indexer?.predict(clients);
//   }
// }

// function defaultUpdate(mc, clients, selection) {
//   return Promise.all(Array.from(clients).map(client => {
//     const filter = selection.predicate(client);
//     if (filter != null) {
//       return mc.updateClient(client, client.query(filter));
//     }
//   }));
// }
