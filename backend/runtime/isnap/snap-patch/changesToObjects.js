/******************************* DEBUG *******************************/

//console.log('Loaded Snap Patch');

/******************************* HELPERS *******************************/

/******************************* HOOKS *******************************/

StageMorph.prototype.initOrig = StageMorph.prototype.init;
StageMorph.prototype.init = function (globals) {
    // Add unique guid parameter to stage
    //console.log("Override was called");
    //console.log(this);
    this.guid = newGuid();

    // Call the original function and return the original result
    var result = this.initOrig.apply(this, arguments);
    return result;
}
