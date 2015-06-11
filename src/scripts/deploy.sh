# #!/bin/sh

# Store original branch
# http://stackoverflow.com/questions/1593051/how-to-programmatically-determine-the-current-checked-out-git-branch
ORIGINAL_HEAD_LOCATION=$(git symbolic-ref -q HEAD)
ORIGINAL_HEAD_LOCATION=${ORIGINAL_HEAD_LOCATION##refs/heads/}
ORIGINAL_HEAD_LOCATION=${ORIGINAL_HEAD_LOCATION:-HEAD}

# Random branch name
TEMP_BRANCH="temp-deploy-$RANDOM"

TAG=$1
REMOTE=$2

reset_branch ()
{
  # Check out original head location and delete the temp branch
  git checkout --quiet -f $ORIGINAL_HEAD_LOCATION
  git branch -D $TEMP_BRANCH
}
trap reset_branch EXIT INT TERM

error_exit ()
{
  echo ""
  echo "ERROR: $1" 1>&2
  echo ""
  exit 1
}

# Create and checkout a temp branch for the tag
# && makes sure the following commands are only executed when the previous command executed successfully
git checkout -b $TEMP_BRANCH $TAG &&

# Build the project
# If custom build command is supplied run it instead
if [ -z "$3" ]
then
  echo "Default build command..."
  npm install && npm run build
else
  echo "Custom build command..."
  $3
fi

# Make sure the previous command succeed, if not, exit with an error.
if [ $? -ne 0 ]
then
  exit 1
fi

# Add public folder and commit
git add -f public &&
git commit -m "Deploy" &&

# Force deploy to target remote.
# get the target remote from parameter
git push -f $REMOTE $TEMP_BRANCH:master