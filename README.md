# react-data-table
This is a very basic code written by a beganner coder and there are things which is still WIP.


# Dependencies

Currently it is dependent on 
1. `React` (as it is only ment to be used in react),
2. `office-uifavric-react`, which is an React package from Microsoft as part of it's Fleuent UI Framework. I am planning on removing that dependency in future.
3. It's also dependent upon an custom helper method pacjage which I have written.(that is WIP)


# Configuration

```javascript
var sampleConfig = {
    columns: [
        {//fully loaded column config
            key: `<STRING>`, //REQUIRED: column key from data
            title: `<STRING>`,//Title of the column : if not available then key will be used as the title.
            type: `<STRING>`,//this is not in use for use and I don't remember what was the plan dor this.
            search: true, //if this is set to true then user will have option to search a column.
            shorting: true, //if this is set to true then user will have option to short each column.
            render: function(cellData,rowData){//this function will return a component or data.
                return <Component/>
            },
            value: function(cellData,rowData){//this function will be used to resolve any complex values like arrays or objects.
                //this will return a primitive value calculated using the data received 
                //If
                return `<PRIMITIVE/>`;
            },
        },
        {//minimal config 
            /*
                this column will hot have any 
                    filters
                    shorting
                    calculated columns
                    title will be the same as key
            */
            key: 'type',
        }
    ],

    //This function will get called when use clicks on the item row
    //this function will get row data from table
    //
    rowClick: function(rowData){
        //this will contain the callback action
    },
    //All custom filters come int the right hand of the table.
    customFilter: [{
        key: 'status',
        title: 'On Tract',
        filter: function(value){
            return value == 'On Track';
        }
    }],
    //give the column name which contains the value of Fy by default it takes FY
    /*
        haveFyFilter : false, //don't show fy filter
        haveFyFilter : true, //show FY filter take `FY` column in the data for using as.
        //NOTE: don't do this right now
        haveFyFilter : function callback(data) {
            //return array of data which will be used 
            //as the data to be used in the filter
            this function will return filter object which will be used by the inner function
        }
        //TODO: do this right now sho that values can ge implemented.
        haveFyFilter : {
            key: 'FY', //key which is being to apply filter
            //if check function in not there then values will be used directly to do the check.
            check: function check(data) {
                apply this data check on the filter
            }
            values: [], //list of values to be shown in the filter. if this is not here then 
            //values form FY column will be used to generate the list.
        }
    */
    haveFyFilter: true,//This will create Fy filter an also te action when user clicks it.
    /*
    These are additional buttons which are added to the table layout 
    they don't have any purpose on their own and can be used for external functions.
    */
    buttons: [{
        title: 'Download Data',
        icon: '',//if that button should have actions
        className: '',//
        style: { },//pass custom style
        callback: function(){
            //when that button is clicked.
        }
    }],

    //These row related actions which can take place on each row and depends upon the table data itself
    actions: {
        title: 'Action',//title of the action column if this value is not present then there will not be any text which means the column will be blank.
        width: 50,//width of the action column, if this value is not there then 
        actions: [
            {
                title: 'Delete Goal',
                type: 'delete',
                onClick : function(rowVal){
                    //TODO: Employment delete Action
                },f
                icon: 'delgif-bin_pos', //give the icon class name
                showlabel: false
            },
            {
                title: 'Edit Goal',
                type: 'edit',
                onClick : function(rowVal){
                    //TODO: Employment delete Action
                },
                icon: 'delgif-file_edit_pos', //give the icon class name
                showlabel: false
            }
        ]
    },
    /*
        [
            {
                icon: 'icon-clann-name',
                title: 'name of the action',//this will be used as tooltip if there is no space for title defined by config
                showTitleText: false, //title text will not show with the icon.
                onClick: the action which need to execute wen the button is click
            }
        ]
        //for each item here actions column will get created
    */
    pagination: 5, //if you want a pagination then pass a number and then that many pages will get created.
}
```



## FYFilter


1. Just passing true will use 'FY' will get filtered and unique values from the same column will be used to get values.
```javascript
haveFyFilter: true, // which means column name 'FY' will get filtered and unique values from the same column will be used to populate the filter options,
```

2. User can also pass object which will have

This object will have information about which column to choose, what title should the column should have and values column should have and how to filter the data.

```javascript
haveFyFilter : {
    key: 'FY', //key which is being to apply filter
    //if check function in not there then values will be used directly to do the check.
    title: 'Placeholder Text',
    check: function check(data) {
        //apply this data check on the filter
    }
    values: [], //list of values to be shown in the filter. if this is not here then 
    //or values can be a function
    values: () => {return [];} //which will return arrays of values should be in the dropdown.
    //values form FY column will be used to generate the list.
    value: (cell, row) => {
        return cell;
    }
}
```
