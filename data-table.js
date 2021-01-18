import React, {Fragment, useState, useEffect, createContext, useContext, useRef} from 'react';
import { IPersonaSharedProps, Persona, PersonaSize, PersonaPresence } from 'office-ui-fabric-react/lib/Persona';
import './datatable.scss';
//import { TestImages } from '@uifabric/example-data';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { BasicShimmer } from '../../helpers/BasicShimmer';
import {HelperValueCheck} from '../Commons/helperMethods';

//Header cell of the top row
const HeaderCell = (props) => {
    var [scKey, updateScKey] = useState();
    useEffect(() => {
        //TODO: re-render header when prop is updated.
    },[props]);

    var shortOption = {};
    if(props.shorting) shortOption.onClick = () => {props.shorting(props.config.key)}

    return (
        <div style={{
                flexGrow : props.flexGrow != 'undefined' ? props.flexGrow : 1,
                flexShrink : props.flexShrink != 'undefined' ? props.flexShrink : 1,
                flexBasis : props.flexBasis != 'undefined' ? props.flexBasis : 'auto',
                position : 'relative',
            }} className="data-table-th">
                <span>{ props.children }</span>
                {props.config.shorting ? <i {...shortOption} className={props.config.shorting == 'asc' ? 'delgif-simple_arrow_up_pos' : props.config.shorting == 'desc' ? 'delgif-simple_arrow_down_pos' : props.config.shorting ? 'delgif-simple_arrow_up_down_pos' : '' }></i> : '' }
        </div>)
}

//Content cells where data is getting rendered.
const ContentCell = (props) => {
    return (<div style={{
                flexGrow : props.flexGrow != 'undefined' ? props.flexGrow : 1,
                flexShrink : props.flexShrink != 'undefined' ? props.flexShrink : 1,
                flexBasis : props.flexBasis != 'undefined' ? props.flexBasis : 'auto',
            }}  className="data-table-td">
            {props.children}
    </div>)
}

//Each row of items and it includes both header and data rows
const TableRow = (props) => {
    return (<div style={props.style} onClick={props.onClick} className={'data-table-tr' + ' ' + props.type }>
        {props.children}
    </div>)
}

//Individual clickable custom filter buttons.
const CustomFilterItem = (props) => {
    return <a onClick={() => {props.onclick(props.index, props.status)}} className={props.status ? 'active' : ''} >{props.children}</a>
}

//TODO: If there are too many custom filters then create a dropdown, instead of bubble for each custom filter item.
//Custom filters added by users.
const CustomFilters = (props) => {
    var [activeState, updateActiveState] = useState('');
    var [customFilterState, updateFilterState] = useState(props);

    useEffect(() => {
        updateFilterState(props);
    },[props]);

    const clickAction = (index, status) => {
        updateActiveState(activeState === index ? '' : index);
        //TODO: update which item is active as filter;
        //TODO: send back current filter item.
        if(!status){
            customFilterState.onClick({
                key: customFilterState.options[index].key,
                check: customFilterState.options[index].filter,
                status: status
            });
        }else{
            customFilterState.onClick({});
        }
    }

    return <Fragment>{customFilterState.options?.map((item, index) => {
        return <CustomFilterItem index={index} onclick={clickAction} key={item.key + index} data={item} status={activeState === index ? true : false}>{item.title}</CustomFilterItem>
    })}</Fragment>
}

//Data table custom pagination
const Pagination = (props) => {
    const limit = props.limit;
    const length = props.length;
    const noOfPages = Math.ceil(length/limit);
    const [currentPage, setCurrentPage] = useState(props.page);
    var _temp = new Array(noOfPages);
    _temp.fill(1);
    const [pages, updatePages] = useState(_temp);

    useEffect(() => {
        var _temp = new Array(Math.ceil(props.length/props.limit));
        _temp.fill(1);
        updatePages(_temp);
    },[props.length, props.limit]);

    //on arrow click
    const arrowClick = (di) => {
        updatePages((oldState) => {
            var newState = [...oldState];
            newState[currentPage - 1] = -newState[currentPage - 1];//negative means this is active.
            return newState;
        });
        var _newPage = (currentPage + di) < 1 ? 1 : (currentPage + di) > noOfPages ? noOfPages : currentPage + di;
        setCurrentPage(_newPage);//this will update the current page
        props.updatePage(_newPage);
    }

    //pagination click
    const paginationClick = (pageNo) => {
        setCurrentPage(pageNo);//this will update the current page
        props.updatePage(pageNo);
    }

    return (<ul className="data-table-pagination">
        <li className={currentPage == 1? 'disabled' : ''}><a onClick={() => {arrowClick(-1)}}><i className="delgif-simple_arrow_left_pos"></i></a></li>
        {pages.map((item,index) => {
            return <li key={index} className={(index + 1) == currentPage ? 'active' : ''}><a onClick={() => {paginationClick(index + 1)}}>{index + 1}</a></li>
        })}
        <li className={currentPage == noOfPages? 'disabled' : ''}><a onClick={() => {arrowClick(1)}}><i className="delgif-simple_arrow_right_pos"></i></a></li>
    </ul>);
}

export const  DataTable = (props) => {
    const [tableData, updateTableData] = useState([]);
    const [options, updateOptions] = useState(props.options);

    //Filter and Shorting state values.
    const [shortingState, updateShortingState] = useState([]);//it will store the col name and shorting order, which will be used.
    const [customFilterState, updateCustomFilterState] = useState([]);//it will store the current state of custom filter : as there can be only one custom filter.
    const [sideFilterState, updateSideFilterState] = useState();//it will store the dropdown filter value.

    //Pagination state values.
    const [currentPage, setCurrentPage] = useState(1);//same value is in Pagination component.
    const [paginationLimit, updatePaginationLimit] = useState(props.options.pagination * 1);//convert boolean to number

    //TODO: instead of calling it FY call is dynamic filter, it will get selected from the config and then used.
    const [fyList, updateFYList] = useState([]);//This contains list of all unique FY list.

    //TODO: instead on manually applying filter every time  Create a useEffect which will automatically apply fll the filters which is required on the state data table.
    //reapply all the shorting and then filters
    useEffect(() =>{
        //TODO: If the values have non-primitive then check weather there is the function to resolve the value 
        //      If function to resolve the value is not there and it's not primitive value then throw error.
        //      Mention the correct error
        updateTableData(() => {
            var newState = props.data;
            //ShortingState : If there is any shorting applied on the data.
            //@optimization: Move shorting to a different section as shorting is not dependent on filtering data.
            if(shortingState.key && shortingState.type){
                newState = newState.sort((oldVal, newVal)=> {
                    //Sometimes oldVal[shortingState.key] and newVal[shortingState.key] can be object or array so in that case 
                    console.log(shortingState.key);
                    console.log(shortingState.type);

                    if(shortingState.type == 'asc'){
                        if(shortingState.value && HelperValueCheck.type(shortingState.value) === "Function"){
                            return shortingState.value(oldVal[shortingState.key],oldVal) < shortingState.value(newVal[shortingState.key],newVal) ? -1 : shortingState.value(oldVal[shortingState.key],oldVal) < shortingState.value(newVal[shortingState.key],newVal) ? 1 : 0;
                        }else {
                            return oldVal[shortingState.key] < newVal[shortingState.key] ? -1 : oldVal[shortingState.key] > newVal[shortingState.key] ? 1 : 0;
                        }
                    }else{
                        if(shortingState.value && HelperValueCheck.type(shortingState.value) === "Function"){
                            return shortingState.value(oldVal[shortingState.key],oldVal) < shortingState.value(newVal[shortingState.key],newVal) ? 1 : shortingState.value(oldVal[shortingState.key],oldVal) < shortingState.value(newVal[shortingState.key],newVal) ? -1 : 0;
                        }else {
                            return oldVal[shortingState.key] < newVal[shortingState.key] ? 1 : oldVal[shortingState.key] > newVal[shortingState.key] ? -1 : 0;
                        }
                    }
                });
            }

            //sideFilterState : If there is some value in sideFilter
            if(sideFilterState){
                var FYCol = options.haveFyFilter === true ? 'FY' : options.haveFyFilter ? options.haveFyFilter : undefined;
                newState = props.data.filter((item) => {
                    var _ret = {...item};
                    if(sideFilterState.key !== 'All')//this value is hard coded so no need to be worried.
                        return sideFilterState.key === _ret[FYCol];
                    else
                        return true;
                });
            }
            
            //CustomFilterState : If CustomFilterState have some values
            if(customFilterState.key && customFilterState.check){
                newState = props.data.filter((item) => {
                    var _ret = {...item}
                    return customFilterState.check(_ret[customFilterState.key]);
                });
            }
            //TODO: Push Custom
            return newState;
        });
    },[shortingState, customFilterState, sideFilterState])

    //on props.data change update update table data and FYList
    useEffect(()=>{
        //replace table state with props state
        updateTableData(props.data);

        //once props.data changes update the FY list with new data
        updateFYList(() => {
            var _new = [];//final list of unique data will be stored here.

            /**
             * If user have passed the FY column name then use that as the FYCOL name else use 'FY' as the column name.
             */
            var _config =  {
                fyColName : false,//default disable the filtering.
                values : [],//predefined set of values to show
                value : false,//this function will be used te extract values form objects, which is handy to decide what values to show.
                check : false//this function will be used when filtering
            }

            if(options.haveFyFilter === true){//just enable FY Filter on default column name which is 'FY'
                _config.fyColName = 'FY';
            }else if(HelperValueCheck.type(options.haveFyFilter) === 'String' && HelperValueCheck.haveVal(options.haveFyFilter)) {
                _config.fyColName = options.haveFyFilter;
            }else if(HelperValueCheck.type(options.haveFyFilter) === 'Object' && HelperValueCheck.haveVal(options.haveFyFilter)){//If there is a custom config
                console.log('--------------------------------------------------------------------------');
                console.log('HelperValueCheck.type(options.haveFyFilter.values) === \'Array\'' + HelperValueCheck.type(options.haveFyFilter.values) === 'Array');
                console.log('--------------------------------------------------------------------------');
                //if there are right key value pair inside.
                if(HelperValueCheck.type(options.haveFyFilter.key) === 'String' && HelperValueCheck.haveVal(options.haveFyFilter.key)){
                    _config.fyColName = options.haveFyFilter.key;
                }

                //If list of dropdown values are provided in advanced then use those values
                if(HelperValueCheck.type(options.haveFyFilter.values) === 'Array' && HelperValueCheck.haveVal(options.haveFyFilter.values)){
                    _config.values = options.haveFyFilter.values;
                }else if(HelperValueCheck.type(options.haveFyFilter.values) === 'Function'){
                    _config.values = options.haveFyFilter.values();
                }

                //If custom check function is defined then use that function.
                if(HelperValueCheck.type(options.haveFyFilter.check) === 'Function'){
                    _config.check = options.haveFyFilter.check;
                }

                //If custom value extract function is defined.
                if(HelperValueCheck.type(options.haveFyFilter.value) === 'Function'){
                    _config.value = options.haveFyFilter.value;
                }
            }

            //If custom list of FY values have been passed then use those values to show in the list.
            if(HelperValueCheck.haveVal(_config.values)){
                //TODO: check weather individual items in the values are array or something else.
                //      Sometimes <Array[Object]> can be passed where each object contains different key value pair which means something for the developer.
                //      In that case use the resolver function passed by the user to resolve the value, if the function is not present then throw error.
                //Just doing a soft check to see if the values inside the values array is primitive or object

                //checking each value of the values to see weather each value is in correct format or not
                for(let __val of _config.values){
                    if((HelperValueCheck.type(val) === 'Array' || HelperValueCheck.type(val) === 'Object') && HelperValueCheck.haveVal(val)){//values are object
                        //call the value resolve function of the fyFilter config to extract the right value.
                        _new.push(_config.value(__val));//this will resolve the value
                    }else if(HelperValueCheck.type(_config.value[0]) === 'String' || HelperValueCheck.type(_config.values[0]) === 'Number'){//these values are primitive
                        //if there are primitive values then insert it directly.
                        _new.push(__val);
                    }
                }
            }else if(HelperValueCheck.haveVal(_config.fyColName)){//This statement will be true if there is FY col or then only it will create the FY - If filtering is enabled and have a fyColName
                //loop through each value in the tableData push all FY values which have not been pushed already to the _new value.
                if(HelperValueCheck.haveVal(props.data)){
                    for(let item of props.data){//If there are rows in the data : which is most likely to be.
                        //Resolve value in case item[fuColName] value is not a straight object.
                        //If _config.value is defined then use that function to extract value or transform value, else check weather the value is primitive value or not, if not stringify it otherwise use the same value.
                        let _checkAgainst = HelperValueCheck.haveVal(_config.value) ? _config.value(item[_config.fyColName]) : (HelperValueCheck.type(item[_config.fyColName]) === 'Object' || HelperValueCheck.type(item[_config.fyColName]) === 'Array') ? JSON.stringify(item[_config.fyColName]) : item[_config.fyColName];
                        if(!_new.includes(_checkAgainst)){
                            _new.push(_checkAgainst);
                        }
                    }
                }
            }
            //short the data so that date comes in the list in a proper order.
            _new.sort((prev, curr) => {
                return prev < curr ? -1 : prev > curr ? 1 : 0;
            });
            return _new;
        })
    },[props.data]);

    //return Table Header V-DOM: filter and table header comes here.
    const ColumnHeader = () => {
        //TODO: If items search then show search icon and trigger search event.
        let headRow = [];
        for(let index in options.columns){
            var oVal = options.columns[index];
            var clickOptions = {};
            //onClickHandlers
            if(oVal.search) clickOptions.search = searchData;
            if(oVal.shorting) clickOptions.shorting = shortData;

            //if there is custom rendered defined for the item then unset the function to generate the data
            headRow.push(<HeaderCell {...clickOptions} config={oVal} flexGrow={oVal.width ? 0 : 1} flexShrink={oVal.width ? 0 : 1} flexBasis={oVal.width} key={oVal.key + index}>{ oVal.title }</HeaderCell>);
        }
        if(options.actions){
            if(options.actions.actions){
                headRow.push(<HeaderCell config={options.actions} flexGrow={options.actions.width ? 0 : 1} flexShrink={options.actions.width ? 0 : 1} flexBasis={options.actions.width} key={'_action'}>{options.actions.title}</HeaderCell>);
            }
            return (<TableRow key={options.actions.title} type="header">{headRow}</TableRow>);
        }
        return (<TableRow key={'header'} type="header">{headRow}</TableRow>);
    }

    //return Table Rows VDOM : select columns based on columns to show in the section
    const rowData = () => {
        var __tempDate = [];
        var start = 0, end = tableData.length - 1;

        //filter through each items in the row data and render the view for items which are not hidden.
        if(paginationLimit) {
            start = (currentPage - 1) * paginationLimit;
            end = ((paginationLimit * currentPage - 1) > tableData.length - 1) ? tableData.length - 1 : (paginationLimit * currentPage - 1);
        }

        for(let rowIndex = start; rowIndex <= end; rowIndex++){//loop through each row of item in data.
            let row = [];//Final list of items which will get returned.
            //check if the key is part of the options col list
            for(let colKey in options.columns){//loop through each columns in config
                var oVal = options.columns[colKey];
                for(let key in tableData[rowIndex]){//loop through each columns in row data
                    if(oVal.key == key){//if col def in options in in the key the push the data in the cells obj defined.
                        //if there is custom rendered defined for the item then used the function to generate the data
                        let __options = {
                            key : String(tableData[rowIndex].id + 'col' + colKey + 'cell' + key)
                        }
                        if(oVal.width) __options.flexGrow = 0; else __options.flexGrow = 1;
                        if(oVal.width) __options.flexShrink = 0; else __options.flexShrink = 1;
                        if(oVal.width) __options.flexBasis = oVal.width;

                        //Children for the content cell
                        let __children = (function(){
                            if(oVal.render){//if render method is defined then use that to show the content in cell
                                //TODO: what if render method doesn't return anything : in that case again use the value method and it that is not
                                //      defined use the actual value
                                return oVal.render(tableData[rowIndex][key],tableData[rowIndex]);
                            }else if(oVal.value){
                                //user is responsible to send appropriate values in this column
                                return oVal.value(tableData[rowIndex][key],tableData[rowIndex]);//if it returns undefined or null use that value only.
                            }else {
                                //TODO: if this any value other than primitive values stringify it.
                                return tableData[rowIndex][key];
                            }
                        })();

                        row.push(<ContentCell {...__options}>{__children}</ContentCell>);
                    }
                }
            }
            if(options.actions){
                if(options.actions.actions){
                    var action = [];
                    for(let i in options.actions.actions){
                        action.push(<a className="table-action" onClick={() => {options.actions.actions[i].onClick(tableData[rowIndex])}} key={i}>
                                {!options.actions.actions[i].showlabel ? 
                                    <i className={options.actions.actions[i].icon}></i> : 
                                    <span className={'action-label ' + (options.actions.actions[i].className ? options.actions.actions[i].className : '')}>{options.actions.actions[i].title}</span>}
                            </a>);
                    }
                    row.push(<ContentCell flexGrow={options.actions.width ? 0 : 1} flexShrink={options.actions.width ? 0 : 1} flexBasis={options.actions.width} key={'action' + rowIndex}>{action}</ContentCell>);
                }
            }
            //only render the table row if it's not hidden, it was getting changed when user was filtering items
            //this will be always true since the value is not getting set to hidden anymore.

            //setting up options for row
            let __rowAction = {
                type : "content",
                key : String('data-' + tableData[rowIndex].id)
            };

            //adding props based on certain conditions.
            if(options.rowClick) __rowAction.onClick = () => {options.rowClick(tableData[rowIndex])};
            if(options.rowClick) __rowAction.style = {cursor : options.rowClick ? 'pointer' : 'default'};

            //push each row in data
            __tempDate.push(<TableRow {...__rowAction}>{row}</TableRow>);
        }
        return __tempDate;
    }

    //return Table Filter VDOM for filter bar based on data and options.
    const userFilters = () => {
        //TODO: maintain filter state here
        //TODO: create a generic filter change function will will apply the filter to all the data in a additive manner.
        //TODO: create separate component for custom filter, buttons, and fy filter all merge them all together here.
        return (<div className="table-filter">
            <div className="static-filter">
                <CustomFilters onClick={(data) => {updateCustomFilterState(data)}} options={options.customFilter}></CustomFilters>
            </div>
            <div className="fy-filter">
                {HelperValueCheck.haveVal(fyList) ? <Dropdown
                    placeholder="Fiscal year"
                    ariaLabel="Fiscal year"
                    options={[{key: 'All', text: 'All', title: 'All'},...fyList?.map((item) => { 
                        return {key: item, text: item, title: item};
                    })]}
                    required={false}
                    onChange={fyFilter}
                /> : <></>}
            </div>
        </div>)
    }

    //TODO: Update FY Filter list so that that can get applied before applying other filters.
    const fyFilter = (_,val) => {
        //just update the FY Filter Column and useEffect which is watching the value will update the filter on the table.
        //TODO: pass the function to resolve the filtering value when there are nested functions.
        updateSideFilterState({...val});
    }

    //when user clicks on column header then filter will trigger from there.
    var shortData = (col) => {
        //Update the options of the table to change state of different fields from asc to desc.
        updateOptions((oldOptions) => {
            var newOptions = {...oldOptions};
            newOptions.columns = newOptions.columns.map((item) => {//each column data definition
                var _temp = {...item};
                if(_temp.key === col){//if it's the current item
                    //update the shorting state values.
                    if(item.shorting === true){  _temp.shorting = 'asc'}
                    if(item.shorting === 'asc') { _temp.shorting = 'desc'}
                    if(item.shorting === 'desc') { _temp.shorting = 'asc'}
                    //Update the filter state of the table
                    updateShortingState({
                        key: col,
                        type: _temp.shorting,
                        value: item.value,//this ia a function which an be used to resolve the value which we want to use to resolve when we are shorting it.
                    });
                }else{//reset all other columns to true or false, which means reset those values to true or false.
                    if(_temp.shorting){
                        _temp.shorting = true;
                    }else{
                        _temp.shorting = false;
                    }
                }
                return _temp;
            });
            return newOptions;
        })
    }

    //Search column data.
    //Notes: This feature will give a search icon on the column header and when user click on the icon
    //       It will show a search dropdown where use can type the value and then it will render the value.
    //       - It will take advantage of column value method to resolve value if there is an object instead of an primitive value
    //       - Once search is applied then it will show button to clear the value.and also will show what search have been applied.
    //TODO: this feature is not implemented.
    var searchData = (col, asc) => {
        updateTableData(tableData);
    }

    return (
        //sow different states based weather table data is loading or loaded.
        props.status == 'LOADING'  ?
        (
            <Fragment>
                <div>
                    {ColumnHeader()}
                    <BasicShimmer />
                </div>
            </Fragment>
            )
        :
        props.data.length > 0 ? (
            <Fragment>
                {userFilters()}
                <div>
                    {ColumnHeader()}
                    {rowData()}
                    {paginationLimit ? <Pagination updatePage={(page) => { setCurrentPage(page) }} limit={paginationLimit * 1} page={currentPage} length={tableData.length}></Pagination> : <></>}
                </div>
            </Fragment>
            ) : (
                <Fragment>
                    {userFilters()}
                    <div>
                        {ColumnHeader()}
                    </div>
                    <div style={{textAlign: 'center'}}>THERE IS NO GOALS DEFINED YET</div>
                </Fragment>
            )
    )
}
