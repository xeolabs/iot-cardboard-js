// const getNodePositionFromElements = (elements: any) => {
//     const nodePositions = elements.reduce((collection, element) => {
//         if (!element.source) {
//             collection.push({
//                 id: element.id,
//                 position: element.position
//             });
//         }
//         return collection;
//     }, []);

//     return nodePositions;
// };

// const getElementsStorageSyntax = (elements: any) => {
//     const elementsStorageSyntax = elements.reduce((collection, element) => {
//         if (element.source) {
//             collection.push({
//                 id: element.id,
//                 source: element.source,
//                 target: element.target
//             });
//         }
//         return collection;
//     }, []);

//     return elementsStorageSyntax;
// };
