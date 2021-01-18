function _helper() {

    /**
     * This function will return the val type of given values using Object.prototype.toString.call()
     * It's returns true type of each values with the help of Object.prototype
     * For NaN or any values which can't be converted to Number or NaN it returns NaN instead of returning Number, which doesn't feels right.
     * @returns {'Number' || 'NaN' || 'String' || 'Function' || 'Object' || 'Array'}
     */
    this.type = (val) => {
        if(Number.isNaN(val)) return 'NaN';
        //this will return : 'Number','String', 'Object', 'Array', 'Function', etc...
        return Object.prototype.toString.call(val).split(' ')[1].split(']')[0];
    },

    /**
     * Return the length of values, for non primitive val type will will return length, 
     * for example in case of Arrays,String it returns its length. 
     * In case of Objects it returns Object.keys(val).length
     * for any other val types like Numbers it converts it into string and then returns length of the string.
     */
    this.length = (val) => {
        if(this.type(val) === 'Array') return val.length;
        if(this.type(val) === 'Object') return Object.keys(val).length;
        if(this.type(val) === 'String') return val.length;
        if(this.type(val) === 'Undefined' || this.type(val) === 'Null') return 0;
        if(this.type(val) !== 'String' || this.type(val) !== 'Object' || this.type(val) !== 'Array') return String(val).length; 
    }

    /**
     * This function returns False if any Array, Object, String don't have any content inside them
     * It also returns false in case value which was passed is Undefined or Null.
     */
    this.haveVal = (val) => {
        if(this.type(val) === 'Array' && this.length(val) === 0) return false;
        if(this.type(val) === 'Object' && this.length(val) === 0) return false;
        if(this.type(val) === 'String' && this.length(val) === 0) return false;
        if(this.type(val) === 'Undefined' || this.type(val) == 'Null') return false;
        if(this.type(val) === 'Boolean') return val;
        else return true;
    }
}

export const HelperValueCheck = {...new _helper()}

export const HelperValueCast = {
    toString : (val) => {

    },
    toObject : (val) => {

    }
}

export const HelperValueDate = {
    month : (val) =>{
        return val.getMonth() + 1;
    },
    year : (val) => {
        return val.getFullYear();
    }
}
