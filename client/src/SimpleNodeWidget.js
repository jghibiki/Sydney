import * as React from "react";
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types';

import ZoomOutMapIcon from '@material-ui/icons/ZoomOutMap';
import MenuIcon from '@material-ui/icons/Menu';
import InfoIcon from '@material-ui/icons/Info';
import CheckCircleIcon from '@material-ui/icons/Check';
import CancelIcon from '@material-ui/icons/Cancel';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import { withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Avatar from '@material-ui/core/Avatar';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';



import { SimpleNodeModel } from "./SimpleNodeModel.js";
import { PortWidget } from "storm-react-diagrams";

const styles = theme => ({
  exitStateIcon: {
    position: "relative",
    top: 2,
    left: 5,
    fontSize: "14px",
  },
  icon: {
    margin: theme.spacing.unit,
  },
  
})

export interface SimpleNodeWidgetProps {
	node: SimpleNodeModel;
	size?: number;
}

export interface SimpleNodeWidgetState {}

class SimpleNodeWidget extends React.Component<SimpleNodeWidgetProps, SimpleNodeWidgetState> {
	static defaultProps: SimpleNodeWidgetProps = {
		size: 150,
		node: null
	};

	constructor(props: SimpleNodeWidgetProps) {
		super(props);
		this.state = {
            dialogOpen: false 
        };
	}

	render() {

        const { classes } = this.props;

        var border_style = "";
        var border_color = "";
        var background_color = this.props.node.color;
        var exit_status = null;


        if(this.props.node.exit_state === "__FINISHED__"){
            border_style = "solid";
            border_color = "#000";
            exit_status = ( 
                <CheckCircleIcon className={classes.exitStateIcon}/>
            );
        }
        else if(this.props.node.exit_state === "__QUIT__"){
            border_style = "solid";
            border_color = "#000";
            exit_status = ( 
                <CancelIcon  className={classes.exitStateIcon}/>
            );
        }
        else{
            border_style = "none";
            border_color = "#000";
            exit_status="";
        }

		return (
            <div style={{ 
                background: background_color,
                padding: "8px",
                "borderRadius": "20px",
                "border": "5px",
                "borderStyle": border_style,
                "borderColor": border_color,
                "maxWidth": "250px",
                "maxHeight": "120px",
            }}>
                <div >
                    <div>
                        <div style={{visibility: "hidden", display:"inline-block", "float": "left" }}>
                            <PortWidget name="in" node={this.props.node}  />
                        </div>
                        <div style={{visibility: "hidden", display:"inline-block", "float": "right"}}>
                            <PortWidget name="out" node={this.props.node}  />
                        </div> 
                        <div style={{display:"inline-block", "wordWrap": "break-word", "maxWidth": "250px", "maxHeight": "35px", "overflow": "auto" }}>
                            {this.props.node.name}
                            {exit_status}
                        </div>
                    </div>
                    <div>
                        <div style={{"textAlign": "center"}}>
                            <div style={{display:"inline-block"}}>
                                <Tooltip title={this.props.node.state} >
                                    <InfoIcon className={classes.icon} />
                                </Tooltip>
                            </div>
                            <MenuIcon className={classes.icon} style={{display:"inline-block"}}  onClick={this.handleClickOpen}/>
                            { this.props.node.info !== undefined &&
                              this.props.node.info.child_pipeline !== undefined &&
                                <a href={this.props.node.info.child_pipeline}
                                   style={{display:"inline-block", color:"#000"}}
                                ><ZoomOutMapIcon className={classes.icon} /></a>
                            }
                        </div>
                    </div>
                </div>
                <Dialog
                  open={this.state.dialogOpen}
                  onClose={this.handleClose}
                  aria-labelledby="form-dialog-title"
                  fullWidth={true}
                >
                    <DialogTitle id="form-dialog-title">{this.props.node.name}</DialogTitle>
                    <DialogContent>
                        <div>
                            <b>Description:</b>
                            <br/>
                            <br/>
                            {
                                this.props.node.info !== undefined && 
                                this.props.node.info.description !== undefined &&
                                this.props.node.info.description.split("\n").map(seg => {
                                    return <div>{seg}<br/></div>
                                })
                            }
                            {
                                (this.props.node.info === undefined ||
                                this.props.node.info.description === undefined) &&
                                <span>No description</span>
                            }
                        </div>

                        <br />
                        <br />
                        <Divider />
                        <br />

                        <div>
                            <b>Links:</b>
                            {
                                this.props.node.info !== undefined && 
                                this.props.node.info.links !== undefined && 
                                    <ul>
                                    {this.props.node.info.links.map(el => {
                                        return <li key={el[0]}><a href={el[1]} target="_blank">{el[0]}</a></li>
                                    }) }
                                    </ul>
                            }
                            {
                                (this.props.node.info === undefined ||
                                this.props.node.info.links === undefined) &&
                                <div>
                                    <br/>
                                    <span>No links</span>
                                </div>
                            }
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleClickClose} color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
		);
	}

    handleClickOpen = () => {
        var model = this.props.node.engine._dialogOpen();
        this.setState({ dialogOpen: true }); 
    }

    handleClickClose = () => {
        var model = this.props.node.engine._dialogClose();
        this.setState({ dialogOpen: false }); 
    }

    componentDidUpdate(prevProps, prevState) {
        // One possible fix...
        let height = ReactDOM.findDOMNode(this).offsetHeight;
        let width = ReactDOM.findDOMNode(this).offsetWidth;
        this.props.node.height = height;
        this.props.node.width = width;
    }
}

SimpleNodeWidget.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SimpleNodeWidget);
