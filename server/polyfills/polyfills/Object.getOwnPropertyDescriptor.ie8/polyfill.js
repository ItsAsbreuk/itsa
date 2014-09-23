// Object.defineProperty
(function () {
	var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    // In Internet Explorer 8 Object.getOwnPropertyDescriptor only accepts DOM objects
    // otherwise it throws an error
	Object.getOwnPropertyDescriptor = function (object, property) {
        var dp;
        try {
            dp = getOwnPropertyDescriptor(object, property);
            return dp;
        }
        catch(err) {
            return {
                configurable: true,
                enumerable: true,
                writable: true,
                value: object[property]
            };

/*
            return object[property] ? {
                configurable: true,
                enumerable: true,
                writable: true,
                value: object[property]
            } : undefined;
*/
        }
	};
})();
