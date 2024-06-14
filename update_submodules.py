import json
import os
import subprocess

CANVAS_FILE = "DreamSong.canvas"
BASE_URL = "https://github.com/InterfaceGuy/"
DIRECTORY_LISTING_FILE = "directory-listing.json"

def parse_canvas_file(file_path):
    # Get the absolute path of the canvas file
    abs_canvas_path = os.path.abspath(file_path)
    # Get the parent directory of the canvas file
    canvas_dir = os.path.dirname(abs_canvas_path)
    # Get the name of the parent folder
    canvas_parent_folder = os.path.basename(canvas_dir)
    
    external_gif_repos = []
    
    with open(file_path, 'r') as file:
        data = json.load(file)
    
    for node in data['nodes']:
        if node['type'] == 'file' and node['file'].endswith('.gif'):
            gif_path = node['file']
            # Get the first part of the GIF path (parent folder)
            gif_parent_folder = gif_path.split('/')[0]
            # Check if the GIF parent folder is different from the canvas parent folder
            if gif_parent_folder != canvas_parent_folder:
                if gif_parent_folder not in external_gif_repos:
                    external_gif_repos.append(gif_parent_folder)
                # Update the GIF path to include the canvas parent folder
                new_gif_path = os.path.join(canvas_parent_folder, gif_path)
                node['file'] = new_gif_path
    
    # Save the updated canvas file
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=2)
    
    return external_gif_repos

def update_submodules(repos):
    # Read the current submodules from .gitmodules
    current_submodules = []
    if os.path.exists('.gitmodules'):
        with open('.gitmodules', 'r') as file:
            for line in file:
                if 'path' in line:
                    current_submodules.append(line.split('=')[1].strip())
    # Determine submodules to add and remove
    to_add = set(repos) - set(current_submodules)
    to_remove = set(current_submodules) - set(repos)
    # Add new submodules
    for repo in to_add:
        url = f"{BASE_URL}{repo}.git"
        subprocess.run(['git', 'submodule', 'add', url, repo])
    # Remove old submodules
    for repo in to_remove:
        # don't remove LiminalWebUI itself
        if repo == "LiminalWebUI":
            continue
        subprocess.run(['git', 'submodule', 'deinit', '-f', repo])
        subprocess.run(['git', 'rm', '-f', repo])
        subprocess.run(['rm', '-rf', f'.git/modules/{repo}'])
    # Update the submodules
    subprocess.run(['git', 'submodule', 'update', '--init', '--recursive'])

def generate_directory_listing(root_dir):
    directory_listing = {}

    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if not d.startswith('.')]  # Filter out hidden directories
        files = [f for f in files if not f.startswith('.')]  # Filter out hidden files

        relative_root = os.path.relpath(root, root_dir)

        if relative_root == '.':
            current_dir = directory_listing
        else:
            current_dir = current_dir.setdefault(relative_root, {})

        for file in files:
            file_path = os.path.join(relative_root, file)
            current_dir[file] = None

        for dir in dirs:
            dir_path = os.path.join(relative_root, dir)
            current_dir[dir] = {}

    return directory_listing

if __name__ == "__main__":
    repos = parse_canvas_file(CANVAS_FILE)
    update_submodules(repos)
    root_dir = "."  # Change this to the desired root directory
    directory_listing = generate_directory_listing(root_dir)

    with open(DIRECTORY_LISTING_FILE, "w") as file:
        json.dump(directory_listing, file, indent=2)