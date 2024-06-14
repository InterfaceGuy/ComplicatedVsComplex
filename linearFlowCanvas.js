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

// Function to sort nodes based on edges
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

  // Find the starting node (node with no incoming edges)
  const incomingEdges = new Set(edges.map(edge => edge.toNode));
  const startingNode = nodes.find(node => !incomingEdges.has(node.id));

  // Perform a topological sort
  const sortedNodes = [];
  const visited = new Set();

  function dfs(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const neighbors = adjList.get(nodeId) || [];
    neighbors.forEach(neighborId => dfs(neighborId));
    sortedNodes.unshift(nodeMap.get(nodeId)); // Add node to the sorted list
  }

  if (startingNode) {
    dfs(startingNode.id);
  }

  return sortedNodes;
}

// Function to render the canvas data in a linear top-to-bottom flow
function renderLinearFlow(nodes) {
  canvasContainer.innerHTML = ''; // Clear existing content
  nodes.forEach((node) => {
    const nodeDiv = document.createElement('div');
    nodeDiv.style.display = 'flex';
    nodeDiv.style.flexDirection = 'column';
    nodeDiv.style.alignItems = 'center';
    nodeDiv.style.marginBottom = '20px';

    if (node.type === 'file') {
      const imgElement = document.createElement('img');
      imgElement.src = getFilePath(node.file); // Use the full relative path without the parent folder
      imgElement.style.width = '1000px';
      imgElement.style.height = '900px';
      imgElement.style.objectFit = 'contain';
      nodeDiv.appendChild(imgElement);
    } else if (node.type === 'text') {
      const textElement = document.createElement('div');
      textElement.textContent = node.text;
      textElement.style.textAlign = 'center';
      textElement.style.fontSize = '32px';
      textElement.style.maxWidth = '1000px';
      textElement.style.color = 'white';
      nodeDiv.appendChild(textElement);
    }

    canvasContainer.appendChild(nodeDiv);
  });
}

// Initialize the rendering process
fetchCanvasData();