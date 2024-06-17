const canvasContainer = document.getElementById('canvas-container');

// Function to fetch the DreamSong.canvas file and parse it
async function fetchCanvasData() {
  try {
    const response = await fetch('DreamSong.canvas');
    const canvasData = await response.json();
    const sortedNodes = sortNodesByEdges(canvasData);
    renderLinearFlow(sortedNodes);
  } catch (error) {
    console.error('Error fetching canvas data:', error);
  }
}

// Function to get the relative path of the file, excluding the canvas parent folder
function getFilePath(filePath) {
  const canvasParentFolder = 'ComplicatedVsComplex';
  if (filePath.startsWith(canvasParentFolder + '/')) {
    return filePath.substring(canvasParentFolder.length + 1); // Remove the parent folder from the path
  }
  return filePath; // Return the original path if no parent folder match
}

// Function to sort nodes based on edges and handle bidirectional links
function sortNodesByEdges(canvasData) {
  const nodes = canvasData.nodes;
  const edges = canvasData.edges;

  // Create a map for quick lookup of nodes by ID
  const nodeMap = new Map();
  nodes.forEach(node => nodeMap.set(node.id, node));

  // Create an adjacency list from edges
  const adjList = new Map();
  edges.forEach(edge => {
    if (!adjList.has(edge.fromNode)) {
      adjList.set(edge.fromNode, []);
    }
    adjList.get(edge.fromNode).push(edge.toNode);
  });

  // Detect bidirectional links and combine nodes
  const bidirectionalPairs = new Set();
  edges.forEach(edge => {
    if (edges.some(e => e.fromNode === edge.toNode && e.toNode === edge.fromNode)) {
      bidirectionalPairs.add([edge.fromNode, edge.toNode].sort().join('-'));
    }
  });

  const combinedNodes = new Set();
  const combinedElements = [];
  bidirectionalPairs.forEach(pair => {
    const [node1, node2] = pair.split('-');
    combinedNodes.add(node1);
    combinedNodes.add(node2);
    combinedElements.push([node1, node2]);
  });

  // Find the starting node (node with no incoming edges)
  const incomingEdges = new Set(edges.map(edge => edge.toNode));
  const startingNode = nodes.find(node => !incomingEdges.has(node.id) && !combinedNodes.has(node.id));

  // Perform a topological sort
  const sortedNodes = [];
  const visited = new Set();

  function dfs(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const combined = combinedElements.find(pair => pair.includes(nodeId));
    if (combined) {
      const [node1, node2] = combined;
      sortedNodes.push([nodeMap.get(node1), nodeMap.get(node2)]); // Add combined nodes
      visited.add(node1);
      visited.add(node2);
      const neighbors1 = adjList.get(node1) || [];
      const neighbors2 = adjList.get(node2) || [];
      neighbors1.forEach(neighborId => dfs(neighborId));
      neighbors2.forEach(neighborId => dfs(neighborId));
    } else {
      const neighbors = adjList.get(nodeId) || [];
      neighbors.forEach(neighborId => dfs(neighborId));
      if (!combinedNodes.has(nodeId)) {
        sortedNodes.unshift(nodeMap.get(nodeId)); // Add node to the sorted list
      }
    }
  }

  if (startingNode) {
    dfs(startingNode.id);
  }

  // Add remaining nodes that were not part of any paths
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      sortedNodes.push(node);
    }
  });

  return sortedNodes;
}

// Function to render the canvas data in a linear top-to-bottom flow with flip-flop pattern for combined elements
function renderLinearFlow(nodes) {
  canvasContainer.innerHTML = ''; // Clear existing content
  let flipFlop = true;

  nodes.forEach((node, index) => {
    if (Array.isArray(node)) {
      const [node1, node2] = node;
      const combinedDiv = document.createElement('div');
      combinedDiv.className = 'container'; // Add container class
      combinedDiv.style.flexDirection = flipFlop ? 'row' : 'row-reverse';

      const mediaNode = node1.type === 'file' ? node1 : node2;
      const textNode = node1.type === 'text' ? node1 : node2;

      const mediaElement = document.createElement('img');
      mediaElement.className = 'media'; // Add media class
      mediaElement.src = getFilePath(mediaNode.file);

      const textElement = document.createElement('div');
      textElement.className = 'text'; // Add text class
      textElement.innerHTML = convertMarkdownToHTML(textNode.text); // Convert markdown to HTML

      combinedDiv.appendChild(mediaElement);
      combinedDiv.appendChild(textElement);
      canvasContainer.appendChild(combinedDiv);

      flipFlop = !flipFlop; // Alternate the flip-flop pattern
    } else {
      if (node.type === 'file') {
        const imgElement = document.createElement('img');
        imgElement.className = 'standalone-media'; // Add standalone-media class
        imgElement.src = getFilePath(node.file);
        canvasContainer.appendChild(imgElement);
      } else if (node.type === 'text') {
        const textElement = document.createElement('div');
        textElement.className = 'text'; // Add text class
        textElement.innerHTML = convertMarkdownToHTML(node.text); // Convert markdown to HTML
        const textContainer = document.createElement('div');
        textContainer.className = 'text-container';
        textContainer.appendChild(textElement);
        canvasContainer.appendChild(textContainer);
      }
    }
  });
}

// Function to convert markdown to HTML
function convertMarkdownToHTML(markdown) {
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
    .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
    .replace(/\n/g, '<br>');
}

// Initialize the rendering process
fetchCanvasData();