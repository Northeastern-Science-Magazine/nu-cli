
# nu-cli

A command-line tool designed to manage and operate NU Sci services seamlessly.

### Example Usage

<img width="695" alt="Screenshot 2024-10-03 at 11 33 54 PM" src="https://github.com/user-attachments/assets/063902a5-8489-4d5c-9cfc-b91cabcc8202">

### Features
- **Unified Docker Management**
  - Build and manage Docker containers effortlessly within a single Docker Compose project using simple commands.
- **Automatic `.env` Distribution**
  - Automatically distribute and manage `.env` files across multiple repositories.
- **Flexible Environment Switching**
  - Switch between various Docker environments, including `testing`, `connected`, `remote`, and more, with ease.
- **Service Status Visualization**
  - Get a clear view of the status of all linked services.

### Installation
1. Clone this repository to your local filesystem:
   ```bash
   git clone https://github.com/Northeastern-Science-Magazine/nu-cli.git
   ```
2. Navigate to the root directory where the repository was cloned and run the following commands:
   ```bash
   npm install
   npm link
   ```

### Usage
1. Ensure the target repository contains a `nucli.config.json` file at the root, defining the relevant service configuration.
2. From the root directory of the target repository, link the service to the CLI by running:
   ```bash
   nucli link
   ```
   - While you can directly run `nucli env <environment> [database]`, running `nucli link` first is recommended for an optimal setup.
3. A `.env` file will be automatically generated in the root directory. This file is created by `nu-cli`.
4. The corresponding Docker Compose project for the service’s container(s) will be set up automatically.
5. To switch the service's environment, use:
   ```bash
   nucli env <environment> [database]
   ```
6. To remove the Docker Compose project, simply run:
   ```bash
   nucli unlink
   ```

### Commands
- **`nucli link`**: Links the current repository to the CLI, setting up the necessary environment files and Docker configuration.
- **`nucli unlink`**: Removes the linked Docker Compose project, undoing the environment setup.
- **`nucli env <environment> [database]`**: Switches the service’s environment and optionally specifies the database.
- **`nucli status`**: Displays the status of all linked services.

### Supported Environments and Databases
- **Backend Service Environments**:
  - `testing`
  - `connected`
- **Optional Database Configuration**:
  - Leave empty for local database.
  - Specify `remote` for remote database connections.
