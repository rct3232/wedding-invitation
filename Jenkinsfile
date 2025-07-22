pipeline {
  agent any

  stages {
    stage('Clone') {
      steps {
        git branch: 'dev', url: 'https://github.com/rct3232/wedding-invitation.git'
      }
    }

    stage('Build') {
      steps {
        sh './gradlew build'
      }
    }
  }
}