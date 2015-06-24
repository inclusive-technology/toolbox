# #!/bin/sh

# Store original branch
# http://stackoverflow.com/questions/1593051/how-to-programmatically-determine-the-current-checked-out-git-branch
ORIGINAL_HEAD_LOCATION=$(git symbolic-ref -q HEAD)
ORIGINAL_HEAD_LOCATION=${ORIGINAL_HEAD_LOCATION##refs/heads/}
ORIGINAL_HEAD_LOCATION=${ORIGINAL_HEAD_LOCATION:-HEAD}

# Random branch name
TEMP_BRANCH="deploy"

TAG=$1
TARGET=$2

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
git branch $TEMP_BRANCH $TAG &&


# Force push a tagged commit to the remote target branch
git push -f origin $TAG:$TARGET