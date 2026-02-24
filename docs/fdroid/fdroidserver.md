
OBSOLETE

cd ~/coding/test/fdroid
# edit the config.yml to set
 
repo_url	http://<192.168.xxx.xx>:8080/repo
repo_name	Nathabee Test Repo
repo_description	Local test repository for Nathabee development.


# This forces F-Droid to scan the APKs and write them into the index
fdroid update -c --create-metadata

