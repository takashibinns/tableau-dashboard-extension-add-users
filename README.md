# Tableau Dashboard Extension: Add users to Tableau button
This project is for a Tableau Dashboard Extension, which displays a button within your dashboard.  Clicking the button will use Tableau's REST API to programmatically add a list of users to a site on Tableau Server or Tableau Cloud.
![Dashboard Extension](https://github.com/takashibinns/tableau-dashboard-extension-add-users/raw/main/screenshots/dashboard-extension.png)

## How to use it

Download the TREX file [here](https://raw.githubusercontent.com/takashibinns/tableau-dashboard-extension-add-users/main/tableau-dashboard-extension-add-user.trex) and [add it](https://help.tableau.com/current/pro/desktop/en-us/dashboard_extensions.htm) to your dashboard.  You will also need a sheet that contains the list of users you want to add.  There are several [required fields](https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#add_user_to_site) when adding users, so make sure to include the following:

- **name**: This is the username, which will always be an email address for Tableau Cloud.  For Tableau Server, it depends on whether or not you have configured a local identity store or external (Active Directory).  If using a local identity store this can be any unique identifier for a user, but with Active Directory this must be a valid username from AD
- **fullName**: The display name for each user, usually first name + last name
- **siteRole**: Can be any of the following: Creator, Explorer, ExplorerCanPublish, SiteAdministratorExplorer, SiteAdministratorCreator, Unlicensed, or Viewer
- **authSetting**: Can be any of the following: ServerDefault, SAML, OpenID, or TableauIDWithMFA

Now that you have the data containing a list of users to add, open the extension's configuration popup.  Enter the authentication details for your Tableau environment (username/password must be an admin user, in order to have permissions to add users).

![Config Popup](https://github.com/takashibinns/tableau-dashboard-extension-add-users/raw/main/screenshots/config-popup.png)

