import React, {Fragment, useState, useEffect, createContext, useContext, useRef} from 'react';
import { IPersonaSharedProps, Persona, PersonaSize, PersonaPresence } from 'office-ui-fabric-react/lib/Persona';
import './datatable.scss';
//import { TestImages } from '@uifabric/example-data';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { BasicShimmer } from '../../helpers/BasicShimmer';
import {check} from '../Commons/helperMethods';

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
                    if(shortingState.type == 'asc'){
                        return oldVal[shortingState.key] > newVal[shortingState.key] ? 1 : -1;
                    }else{
                        return oldVal[shortingState.key] > newVal[shortingState.key] ? -1 : 1;
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
             * If user have passed the FY column name then use that as the FYCOOL name else use 'FY' as the column name.
             */
            var fyColName = options.haveFyFilter === true ? 'FY' : options.haveFyFilter ? options.haveFyFilter : false;
            //This statement will be true if there is FY col or then only it will create the FY
            if(fyColName){
                for(let item of tableData){
                    if(!_new.includes(item[fyColName])){
                        _new.push(item[fyColName]);
                    }
                }
                _new.sort((prev, curr) => {
                    return prev < curr ? -1 : prev > curr ? 1 : 0;
                });
            }
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
                            if(oVal.render){
                                return oVal.render(tableData[rowIndex][key],tableData[rowIndex]);
                            }else if(oVal.value){
                                return oVal.value(tableData[rowIndex][key],tableData[rowIndex]);
                            }else {
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
                <CustomFilters onClick={(data) => { updateCustomFilterState(data) }} options={options.customFilter}></CustomFilters>
            </div>
            <div className="fy-filter">
                <Dropdown
                    placeholder="Fiscal year"
                    ariaLabel="Fiscal year"
                    options={[{key: 'All', text: 'All', title: 'All'},...fyList?.map((item) => { 
                        return {key: item, text: item, title: item};
                    })]}
                    required={false}
                    onChange={fyFilter}
                />
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
                    if(item.shorting == true){  _temp.shorting = 'asc'}
                    if(item.shorting == 'asc') { _temp.shorting = 'desc'}
                    if(item.shorting == 'desc') { _temp.shorting = 'asc'}
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
    //TODO: this feature is not implemented
    var searchData = (col, asc) => {
        updateTableData(tableData);
    }

    return (
        props.status == 'LOADING'  ?
        (
            <Fragment>
                {userFilters()}
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
