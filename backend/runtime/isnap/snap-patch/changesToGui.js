/******************************* DEBUG *******************************/

//console.log('Loaded Snap Patch');

/******************************* HELPERS *******************************/


/******************************* HOOKS *******************************/

IDE_Morph.prototype.initOrig = IDE_Morph.prototype.init;
IDE_Morph.prototype.init = function (config) {
    // Set environment flag
    localStorage.setItem('assignmentEnvironment', "Snap");
    //console.log("Override was called");
    //console.log(localStorage.getItem('assignmentEnvironment'));

    // Call the original function and return the original result
    var result = this.initOrig.apply(this, arguments);
    return result;
}

IDE_Morph.prototype.createPaletteOrig = IDE_Morph.prototype.createPalette;
IDE_Morph.prototype.createPalette = function (forSearching) {
    // Call original implementation
    const palette = this.createPaletteOrig(forSearching);
    // console.log("got to outer function");

    // Save the original drop handler
    const reactToDropOfOrig = palette.reactToDropOf;

    // Wrap it
    palette.reactToDropOf = function (droppedMorph, hand) {
        // console.log("got to inner function");
        if (droppedMorph instanceof BlockMorph) {
            Trace.log('Block.dropDestroy', droppedMorph.blockId());
        }

        // Continue normal behavior
        return reactToDropOfOrig.apply(this, arguments);
    };

    // Call the original function and return the original result
    return palette;
}