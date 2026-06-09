$ErrorActionPreference = 'Stop'

Set-Location -Path "d:\TODO\frontend"

if (-not (Test-Path .git)) {
    git init
}

# Ensure local config
$email = git config --local user.email
if (-not $email) {
    git config user.email "bot@example.com"
    git config user.name "Bot"
}

# The folders to make branches for:
$folders = @("core", "features", "layouts", "shared")

git add .
foreach ($folder in $folders) {
    if (Test-Path "src/app/$folder") {
        git reset "src/app/$folder"
    }
}

# Check if there's anything to commit to avoid errors if already committed
if (git status --porcelain) {
    git commit -m "Initial commit: Base frontend files"
}

git branch -M main
git checkout -b development

foreach ($folder in $folders) {
    if (Test-Path "src/app/$folder") {
        git checkout -b $folder development
        git add "src/app/$folder"
        
        $status = git status --porcelain
        if ($status) {
            git commit -m "Add $folder structure"
        }

        git checkout development
        git merge $folder --no-ff --no-edit -m "Merge branch '$folder' into development"
    }
}

# release branch
git checkout -b release/v1.0.0 development

# merge release to main
git checkout main
git merge release/v1.0.0 --no-ff --no-edit -m "Merge release/v1.0.0 into main"

# add origin and push
git remote add origin https://github.com/harikrishnan-ps/TODO-FRONTEND.git
git push -u origin --all
