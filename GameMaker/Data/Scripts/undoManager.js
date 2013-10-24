GM.UndoManager = (function () {
    //Fields

    //The big thingy
    var undoStack = [];
    var undoPointer = 0;

    //Undo redo
    //Defines an action (such as deletion/addition of stuff)
    function ViewModelAction(undoAction, redoAction, args, scope) {
        this.undoAction = undoAction;
        this.redoAction = redoAction;
        this.args = args;
        this.scope = scope || args || this;
    }

    ViewModelAction.prototype.undo = function () {
        this.undoAction.call(this.scope, this.args);
    };

    ViewModelAction.prototype.redo = function () {
        this.redoAction.call(this.scope, this.args);
    };

    var addAction = function (action) {
        //Remove now obsolete actions..
        undoStack.splice(undoPointer + 1, Number.MAX_VALUE);

        //..and add the new action.
        undoStack.push(action);
        undoPointer = undoStack.length - 1;
    }

    var undo = function () {
        if (undoPointer < 0)
            return false;

        GM.Logger.logSuccess("Undo " + undoStack[undoPointer].redoAction.name);
        undoStack[undoPointer--].undo();
        
        return true;
    }

    var redo = function () {
        if (undoPointer + 1 >= undoStack.length)
            return false;

        undoStack[++undoPointer].redo();
        GM.Logger.logSuccess("Redo " + undoStack[undoPointer].redoAction.name);

        return true;
    }

    return {
        ViewModelAction: ViewModelAction,
        addAction: addAction,
        undo: undo,
        redo: redo
    };
}());