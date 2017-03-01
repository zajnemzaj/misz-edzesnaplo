/*jshint browser:true */
/*global $ */(function()
{
 "use strict";
 /*
   hook up event handlers
 */



 function register_event_handlers()
 {


     /* button  Button */
    $(document).on("click", ".uib_w_12", function(evt)
    {
         /*global activate_subpage */
         activate_subpage("#lista");
         return false;
    });

        /* button  Új Edzés */


        /* button  Új Edzés */
    $(document).on("click", ".uib_w_14", function(evt)
    {
         /*global activate_subpage */
         activate_subpage("#page_73_13");
         return false;
    });

        /* button  Lista */
    $(document).on("click", ".uib_w_15", function(evt)
    {
         /*global activate_subpage */
         activate_subpage("#new");
         return false;
    });

        /* button  Beállítások */


        /* button  #buttonExit */
    $(document).on("click", "#buttonExit", function(evt)
    {
		/* your code goes here */
		window.close();
    	if(navigator.app){
        	navigator.app.exitApp();
    	}else if(navigator.device){
        	navigator.device.exitApp();
    	}
        return false;
    });

        /* button  #buttonSave */


        /* button  #buttonSave */


        /* button  #buttonSave */


        /* button  #buttonSync */
    $(document).on("click", "#buttonSync", function(evt)
    {
        /* your code goes here */
		// googleDrive.uploadFile( function(success) { alert("All file has been successfully uploaded"); }, function(error) { alert("Something went wrong. Please try again..."); }, filePath);
         //return false;
    });

        /* button  #buttonSave
    $(document).on("click", "#buttonSave", function(evt)
    {
        /* your code goes here
		 writeFile();
         return false;
    });
    */
        /* button  #buttonReadme */
    $(document).on("click", "#buttonReadme", function(evt)
    {
        /* your code goes here */

         return false;
    });

        /* button  #tabSettings */


        /* button  #tabSettings */


        /* button  #tabSettings */
    $(document).on("click", "#tabSettings", function(evt)
    {
         /*global activate_subpage */
         activate_subpage("#settings");
         return false;
    });

    }
 document.addEventListener("app.Ready", register_event_handlers, false);
})();
