/******************************* DEBUG *******************************/

//console.log('Loaded Snap Patch');

/******************************* HELPERS *******************************/

BlockMorph.prototype.blockId = function() {
    return {
        'selector': this.selector,
        'id': this.id,
        'template': this.isTemplate,
        'spec': this.blockSpec,
    };
};

/******************************* HOOKS *******************************/

BlockMorph.prototype.reactToTemplateCopyOrig = BlockMorph.prototype.reactToTemplateCopy;
BlockMorph.prototype.reactToTemplateCopy = function () {
    // Logging call
    Trace.log('Block.created', this.blockId());

    // Call the original function and return the original result
    var result = this.reactToTemplateCopyOrig.apply(this, arguments);
    return result;
}

BlockMorph.prototype.prepareToBeGrabbedOrig = BlockMorph.prototype.prepareToBeGrabbed;
BlockMorph.prototype.prepareToBeGrabbed = function (hand) {
    // Logging call
    Trace.log('Block.grabbed', {
        'id': this.blockId(),
        'origin': this.bounds.origin
    });

    // Call the original function and return the original result
    var result = this.prepareToBeGrabbedOrig.apply(this, arguments);
    return result;
}

BlockMorph.prototype.snapOrig = BlockMorph.prototype.snap;
BlockMorph.prototype.snap = function () {
    // Logging call
    Trace.log('Block.snapped', {
        'id': this.blockId(),
        'origin': this.bounds.origin,
    });

    // Call the original function and return the original result
    var result = this.snapOrig.apply(this, arguments);
    return result;
}

BlockMorph.prototype.mouseClickLeftOrig = BlockMorph.prototype.mouseClickLeft;
BlockMorph.prototype.mouseClickLeft = function () {
    // Logging call
    var top = this.topBlock(),
    receiver = top.scriptTarget(),
    stage;

    if (receiver) {
        stage = receiver.parentThatIsA(StageMorph);
        if (stage) {
            var process = stage.threads.findProcess(top, receiver);
            if (process && !process.readyToTerminate) {
                Trace.log('Block.clickStopRun', top.blockId());
            } else {
                Trace.log('Block.clickRun', top.blockId());
            }
        }
    }

    // Call the original function and return the original result
    var result = this.mouseClickLeftOrig.apply(this, arguments);
    return result;
}

BlockMorph.prototype.userSetSpecOrig = BlockMorph.prototype.userSetSpec;
BlockMorph.prototype.userSetSpec = function (spec) {
    // Logging call
    Trace.log('Block.rename', {
        'id': this.parentThatIsA(BlockMorph).blockId(),
        'name': spec,
    });

    // Call the original function and return the original result
    var result = this.userSetSpecOrig.apply(this, arguments);
    return result;
}