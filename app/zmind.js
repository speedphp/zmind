const fs = nw.require('fs')
let mindData = MindElixir.new('new topic')
let savePath = ""
let isSaved = true
let argv = nw.App.fullArgv
if (argv.length > 0) {
    for (let k in argv) {
        let testExtension = argv[k].split('.').pop().toLowerCase()
        if (testExtension == 'zm') {
            let testFilePath = decodeURIComponent(argv[k].replace("file://", ""))
            if (fs.existsSync(testFilePath)) {
                let tmpData = fs.readFileSync(testFilePath)
                mindData = JSON.parse(tmpData.toString())
                savePath = testFilePath
                break
            }
        }
    }
}

let elixir = createMindMap(mindData)

$(document).ready(function () {
    elixir.init()
    $(document).attr("title", E('root').nodeObj.topic)
    $("#map").css("height", window.innerHeight)
})
$(window).resize(function () {
    $("#map").css("height", window.innerHeight)
})

$("#saveFileDialog").change(function () {
    let filePath = $(this).val()
    if (filePath != "") {
        let fileExtension = filePath.split('.').pop().toLowerCase()
        if (fileExtension != 'zm') filePath += '.zm'
        savePath = filePath
        saveFile()
    }
})

$("#openFileDialog").change(function () {
    let filePath = $(this).val()
    if (filePath != "") {
        if (isSaved == false) {
            alert("文件未保存，请先保存？")
        } else {
            let tmpData = fs.readFileSync(filePath)
            mindData = JSON.parse(tmpData.toString())
            elixir = createMindMap(mindData)
            elixir.init()
            savePath = filePath
            $(document).attr("title", E('root').nodeObj.topic)
        }
    }
})
let selectNodeId = null
let selectNodeIdHolder = null
elixir.bus.addListener('operation', function (operation) {
    isSaved = false
    if (operation.name == "beginEdit") {
        selectNodeIdHolder = selectNodeId
        selectNodeId = null
    } else if (operation.name == "finishEdit") {
        selectNodeId = selectNodeIdHolder
    }
})
elixir.bus.addListener('selectNode', function (node) {
    isSaved = false
    selectNodeId = node.id
})
elixir.bus.addListener('unselectNode', function () {
    selectNodeId = null
})
document.addEventListener("paste", function (e) {
    if (selectNodeId != null) {
        let clipboard = nw.Clipboard.get()
        elixir.addChild(E(selectNodeId), {
            topic: clipboard.get('text'),
            id: generateUUID(),
        })
        e.preventDefault()
    }
})

let ctrl = require("os").platform() == "darwin" ? "cmd" : "ctrl"
let submenu = new nw.Menu()
submenu.append(new nw.MenuItem({
    label: '新建', key: "n", modifiers: ctrl, click: function () {
        nw.Window.open("main.html", {
            new_instance: true
        })
    }
}))
submenu.append(new nw.MenuItem({
    label: '打开...', key: "o", modifiers: ctrl, click: function () {
        $("#openFileDialog").trigger("click")
    }
}))
submenu.append(new nw.MenuItem({type: 'separator'}))
submenu.append(new nw.MenuItem({
    label: '保存思维导图', key: "s", modifiers: ctrl, click: function () {
        $(document).attr("title", E('root').nodeObj.topic)
        if (savePath != "" && fs.existsSync(savePath)) {
            saveFile()

        } else {
            $("#saveFileDialog").attr("nwsaveas", E('root').nodeObj.topic + ".zm")
            $("#saveFileDialog").trigger("click")
        }
    }
}))
submenu.append(new nw.MenuItem({type: 'separator'}))
submenu.append(new nw.MenuItem({
    label: '退出 Zmind', key: "q", modifiers: ctrl, click: function () {
        nw.Window.get().close()
    }
}))

let topmenu = new nw.Menu({type: 'menubar'})
topmenu.createMacBuiltin("Zmind", {hideWindow: true})
topmenu.append(new nw.MenuItem({label: "文件", submenu: submenu}))

nw.Window.get().menu = topmenu
nw.Window.get().on('close', function () {
    if (isSaved == true && savePath != "") {
        nw.Window.get().close(true)
    }
    if (window.confirm("不保存直接退出？")) {
        nw.Window.get().close(true)
    }
})

function saveFile() {
    if (isSaved != true) {
        let data = elixir.getAllData()
        data.direction = elixir.direction
        fs.writeFileSync(savePath, JSON.stringify(data))
        isSaved = true
        setInterval(function () {
            saveFile()
        }, 1000 * 60)
    }
}

function createMindMap(data) {
    return new MindElixir({
        el: '#map',
        direction: (data.direction == undefined) ? MindElixir.LEFT : data.direction,
        data: data,
        draggable: true,
        contextMenu: true,
        toolBar: true,
        nodeMenu: true,
        keypress: true,
    })
}

function generateUUID() {
    return (
        new Date().getTime().toString(16) +
        Math.random()
            .toString(16)
            .substr(2)
    ).substr(2, 16)
}