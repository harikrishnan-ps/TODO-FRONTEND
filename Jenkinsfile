pipeline {
    agent any

    // This section assumes you have NodeJS plugin configured in Jenkins 
    // named 'node22' (or similar, depending on your setup).
    // If your Jenkins agents already have Node installed globally, you can remove the 'tools' block.
    tools {
        nodejs 'node22'
    }

    environment {
        // Define any environment variables here
        NODE_ENV = 'production'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                // Using 'npm ci' for a clean, deterministic install in CI environments
                echo "Installing dependencies..."
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                // Add your linting command if configured in package.json
                // sh 'npm run lint'
                echo "Skipping linting for now"
            }
        }

        stage('Test') {
            steps {
                // Execute tests. The flags ensure it runs once (no watch) in headless mode for CI environments.
                echo "Running unit tests..."
                sh 'npm run test -- --watch=false --browsers=ChromeHeadless'
            }
        }

        stage('Build Angular App') {
            steps {
                echo "Building the application..."
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                // If you also want Jenkins to build the Docker image using your Dockerfile
                echo "Building Docker image..."
                sh 'docker build -t todo-frontend:latest -t todo-frontend:${BUILD_NUMBER} .'
            }
        }
    }

    post {
        always {
            // Clean up the workspace after the build finishes
            cleanWs()
        }
        success {
            echo "✅ Frontend Pipeline completed successfully!"
        }
        failure {
            echo "❌ Frontend Pipeline failed. Please check the logs."
        }
    }
}
