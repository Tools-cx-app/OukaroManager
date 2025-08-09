#!/bin/sh

# OukaroManager Service Script
# Runs in background to maintain apps.json accuracy
# Auto-generates configuration on boot and periodically updates

MODDIR=${0%/*}
LOG=$MODDIR/oukaro.log

until [ -d $MODDIR ]; do
	sleep 1
done

RUST_BACKTRACE=1 nohup $MODDIR/oukaro >$LOG 2>&1 &
