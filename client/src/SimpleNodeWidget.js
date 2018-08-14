import * as React from "react";
import PropTypes from 'prop-types';

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

import { SimpleNodeModel } from "./SimpleNodeModel.js";
import { PortWidget } from "storm-react-diagrams";

const styles = theme => ({
  icon: {
    position: "relative",
    top: 2,
    left: 5,
    fontSize: "14px",
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
                <CheckCircleIcon className={classes.icon}/>
            );
        }
        else if(this.props.node.exit_state === "__QUIT__"){
            border_style = "solid";
            border_color = "#000";
            exit_status = ( 
                <CancelIcon  className={classes.icon}/>
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
            }}>
                <div onClick={this.handleClickOpen}>
                    <div style={{visibility: "hidden", display:"inline-block"}}>
                        <PortWidget name="in" node={this.props.node}  />
                    </div>
                    <div style={{display:"inline-block"}}>
                        {this.props.node.name}
                        {exit_status}
                    </div>
                    <div style={{visibility: "hidden", display:"inline-block"}}>
                        <PortWidget name="out" node={this.props.node}  />
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
                                this.props.node.info.description 
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
        this.setState({ dialogOpen: true }); 
    }

    handleClickClose = () => {
        this.setState({ dialogOpen: false }); 
    }
}

SimpleNodeWidget.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SimpleNodeWidget);
