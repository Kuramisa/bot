clear
echo "Pulling updates from Github"
git pull bot master &> /dev/null
echo "Updating Packages"
yarn > /dev/null
echo "Building the bot"
yarn build > /dev/null