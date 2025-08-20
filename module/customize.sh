SKIPUNZIP=1

ui_print "安装中"
sleep 0.1
ui_print "解压文件中"
unzip -o "$ZIPFILE" -x "META-INF/*" -d "$MODPATH"

set_perm_recursive $MODPATH 0 0 0755 0644
set_perm $MODPATH/oukaro 0 0 0755
